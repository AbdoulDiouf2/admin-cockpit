import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { agentReleasesApi } from '@/api';
import { useToast } from '@/hooks/use-toast';

interface UploadMeta {
  version: string;
  platform: string;
  arch: string;
  changelog?: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  fileName: string | null;
  error: string | null;
}

interface UploadReleaseContextValue extends UploadState {
  startUpload: (file: File, meta: UploadMeta) => void;
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

  const startUpload = useCallback((file: File, meta: UploadMeta) => {
    setState({ isUploading: true, progress: 0, fileName: file.name, error: null });

    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('version', meta.version);
    formData.append('platform', meta.platform);
    formData.append('arch', meta.arch);
    if (meta.changelog) formData.append('changelog', meta.changelog);

    agentReleasesApi.upload(formData, (pct) => setState((s) => ({ ...s, progress: pct })))
      .then(() => {
        setState((s) => ({ ...s, isUploading: false, progress: 100 }));
        queryClient.invalidateQueries({ queryKey: ['agent-releases'] });
        toast({ title: 'Release publiée', description: `${file.name} a été uploadé avec succès.` });
      })
      .catch((err: any) => {
        const msg = err?.response?.data?.message ?? err?.message ?? 'Erreur lors de l\'upload.';
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
