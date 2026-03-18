import { useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useAuditLog } from '@/hooks/use-api';
import { AuditLogDetailContent } from './audit-log-shared';

interface AuditLogDrawerProps {
  logId: string | null;
  onClose: () => void;
  onOpenDetail?: (id: string) => void;
}

export function AuditLogDrawer({ logId, onClose, onOpenDetail }: AuditLogDrawerProps) {
  const { data: log, isLoading, error } = useAuditLog(logId ?? '');

  // Close on Escape key
  useEffect(() => {
    if (!logId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [logId, onClose]);

  if (!logId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-[600px] z-50 bg-background shadow-2xl border-l flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="text-sm font-semibold">Détail du log</h2>
          <div className="flex items-center gap-1">
            {onOpenDetail && logId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Ouvrir la page complète"
                onClick={() => onOpenDetail(logId)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-5">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
              </div>
            ) : error || !log ? (
              <div className="flex items-center justify-center h-64 text-destructive text-sm">
                Log introuvable
              </div>
            ) : (
              <AuditLogDetailContent log={log} />
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
