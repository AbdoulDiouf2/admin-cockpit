import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { agentReleasesApi } from '@/api';
import { useToast } from '@/hooks/use-toast';

interface UploadState {
  isUploading: boolean;
  progress: number;
  fileName: string | null;
  error: string | null;
}

interface UploadReleaseContextValue extends UploadState {
  startUpload: (formData: FormData, fileName: string) => void;
  dismiss: () => void;
}

const UploadReleaseContext = createContext<UploadReleaseContextValue | null>(null);

export function UploadReleaseProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    fileName: null,
    error: null,
  });

  const startUpload = useCallback((formData: FormData, fileName: string) => {
    setState({ isUploading: true, progress: 0, fileName, error: null });

    agentReleasesApi.upload(
      formData,
      (pct) => setState((s) => ({ ...s, progress: pct })),
    )
      .then(() => {
        setState((s) => ({ ...s, isUploading: false, progress: 100 }));
        queryClient.invalidateQueries({ queryKey: ['agent-releases'] });
        toast({ title: 'Release publiée', description: `${fileName} a été uploadé avec succès.` });
      })
      .catch((err: any) => {
        const msg = err?.response?.data?.message ?? 'Erreur lors de l\'upload.';
        setState((s) => ({ ...s, isUploading: false, error: msg }));
        toast({ title: 'Erreur upload', description: msg, variant: 'destructive' });
      });
  }, [queryClient, toast]);

  const dismiss = useCallback(() => {
    setState({ isUploading: false, progress: 0, fileName: null, error: null });
  }, []);

  return (
    <UploadReleaseContext.Provider value={{ ...state, startUpload, dismiss }}>
      {children}
    </UploadReleaseContext.Provider>
  );
}

export function useUploadRelease() {
  const ctx = useContext(UploadReleaseContext);
  if (!ctx) throw new Error('useUploadRelease must be used inside UploadReleaseProvider');
  return ctx;
}
