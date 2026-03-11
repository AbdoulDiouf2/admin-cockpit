import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Human-readable labels and colors for each audit event type
const EVENT_META: Record<string, { label: string; classes: string }> = {
  user_login:               { label: 'Connexion',             classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  user_logout:              { label: 'Déconnexion',           classes: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  user_created:             { label: 'Utilisateur créé',      classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  user_updated:             { label: 'Utilisateur modifié',   classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  user_deleted:             { label: 'Utilisateur supprimé',  classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  user_invited:             { label: 'Invitation envoyée',    classes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  role_created:             { label: 'Rôle créé',             classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  role_updated:             { label: 'Rôle modifié',          classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  role_deleted:             { label: 'Rôle supprimé',         classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  organization_created:     { label: 'Organisation créée',    classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  organization_updated:     { label: 'Organisation modifiée', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  agent_registered:         { label: 'Agent connecté',        classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  agent_token_generated:    { label: 'Token généré',          classes: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  agent_token_regenerated:  { label: 'Token régénéré',        classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  agent_error:              { label: 'Erreur agent',          classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  password_reset_requested: { label: 'Reset MDP demandé',     classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  password_reset_completed: { label: 'MDP réinitialisé',      classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
};

function EventBadge({ event }: { event: string }) {
  const meta = EVENT_META[event];
  if (!meta) {
    // Fallback: format raw key (user_login → User Login)
    const fallbackLabel = event.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        {fallbackLabel}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.classes}`}>
      {meta.label}
    </span>
  );
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollText, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useAuditLogs, useAuditLogEventTypes, AuditLogFilters } from '@/hooks/use-api';
import { AuditLogFilters as AuditLogFiltersComponent } from './AuditLogFilters';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 25;

export function AuditLogsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: PAGE_SIZE,
    offset: 0,
  });

  const { data: logsResponse, isLoading, error } = useAuditLogs(filters);
  const { data: eventTypes = [] } = useAuditLogEventTypes();

  const handleFiltersChange = (newFilters: AuditLogFilters) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const totalPages = Math.ceil((logsResponse?.meta?.total || 0) / PAGE_SIZE);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    setFilters((f) => ({ ...f, offset: page * PAGE_SIZE }));
  };

  const handleExportCsv = () => {
    const logs = logsResponse?.data || [];
    if (logs.length === 0) return;

    const headers = ['Date', 'Événement', 'Utilisateur', 'Organisation', 'IP'];
    const rows = logs.map((log) => [
      format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm'),
      log.event,
      log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
      log.organization?.name || 'N/A',
      log.ipAddress || '-',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: t('auditLogs.exportSuccess') });
  };

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
            {t('auditLogs.listTitle')}
          </CardTitle>
          <CardDescription>{t('auditLogs.listSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <AuditLogFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onExport={handleExportCsv}
            eventTypes={eventTypes}
          />

          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="h-[400px] flex items-center justify-center text-destructive">
              Erreur lors du chargement des logs d'audit
            </div>
          ) : (
            <>
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
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/audit-logs/${log.id}`)}
                      >
                        <TableCell className="text-sm whitespace-nowrap">
                          {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <EventBadge event={log.event} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.user
                            ? `${log.user.firstName} ${log.user.lastName}`
                            : 'System'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.organization?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {log.ipAddress || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {logsResponse?.data?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          {t('common.noData')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm text-muted-foreground">
                    {t('auditLogs.page')} {currentPage + 1} {t('auditLogs.of')}{' '}
                    {totalPages}
                    {logsResponse?.meta?.total ? (
                      <span className="ml-2">({logsResponse.meta.total} entrées)</span>
                    ) : null}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={currentPage === 0}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={!logsResponse?.meta?.hasMore}
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
