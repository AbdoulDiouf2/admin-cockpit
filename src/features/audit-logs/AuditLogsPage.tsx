import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollText, Loader2 } from 'lucide-react';
import { auditLogsApi } from '@/api';
import { format } from 'date-fns';

export function AuditLogsPage() {
  const { t } = useTranslation();

  const { data: logsResponse, isLoading, error } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const response = await auditLogsApi.getAll();
      return response.data;
    },
  });

  return (
    <div className="space-y-6" data-testid="audit-logs-page">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('auditLogs.title')}</h1>
        <p className="text-muted-foreground">{t('auditLogs.subtitle')}</p>
      </div>

      {/* Audit logs list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            {t('auditLogs.listTitle') || 'Historique des actions'}
          </CardTitle>
          <CardDescription>
            {t('auditLogs.listSubtitle') || 'Toutes les actions effectuées sur la plateforme'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="h-[400px] flex items-center justify-center text-destructive">
              Erreur lors du chargement des logs d'audit
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Événement</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logsResponse?.data?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{log.event}</span>
                      </TableCell>
                      <TableCell>
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                      </TableCell>
                      <TableCell>{log.organization?.name || 'N/A'}</TableCell>
                      <TableCell className="text-xs font-mono">{log.ipAddress || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {logsResponse?.data?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Aucun log d'audit trouvé.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
