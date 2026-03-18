import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useAuditLog } from '@/hooks/use-api';
import { AuditLogDetailContent } from './audit-log-shared';

export function AuditLogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: log, isLoading, error } = useAuditLog(id!);

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (error || !log) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/audit-logs')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux logs
        </Button>
        <div className="flex h-64 items-center justify-center text-destructive">
          Log introuvable
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/audit-logs')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour aux logs
      </Button>
      <AuditLogDetailContent log={log} />
    </div>
  );
}
