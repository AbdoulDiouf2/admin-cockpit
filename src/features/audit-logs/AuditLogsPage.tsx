import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollText, Loader2, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { useAuditLogs, useAuditLogEventTypes, AuditLogFilters } from '@/hooks/use-api';
import { AuditLogFilters as AuditLogFiltersComponent } from './AuditLogFilters';
import { AuditLogDrawer } from './AuditLogDrawer';
import { EventBadge } from './audit-log-shared';
import { useToast } from '@/hooks/use-toast';

// ─── Category definitions ──────────────────────────────────────────────────────

type CategoryKey = 'all' | 'auth' | 'agents' | 'dashboards' | 'onboarding' | 'billing' | 'admin' | 'nlq';

const CATEGORIES: Record<CategoryKey, { label: string; events: string[] }> = {
  all: { label: 'Tous', events: [] },
  auth: {
    label: 'Authentification',
    events: [
      'user_login', 'user_logout', 'user_created', 'user_updated', 'user_deleted',
      'user_invited', 'users_invited_bulk', 'profile_updated',
      'token_refreshed', 'password_reset_requested', 'password_reset_completed',
    ],
  },
  agents: {
    label: 'Agents',
    events: [
      'agent_registered', 'agent_deleted', 'agent_token_generated', 'agent_token_regenerated',
      'agent_token_revoked', 'agent_token_expired', 'agent_heartbeat', 'agent_error',
      'agent_connection_tested', 'agent_query_executed', 'agent_job_timeout',
    ],
  },
  dashboards: {
    label: 'Dashboards',
    events: [
      'dashboard_created', 'dashboard_updated', 'dashboard_deleted',
      'widget_added', 'widget_updated', 'widget_removed',
    ],
  },
  onboarding: {
    label: 'Onboarding',
    events: [
      'onboarding_step_completed', 'onboarding_completed', 'datasource_configured', 'agent_linked',
    ],
  },
  billing: {
    label: 'Facturation',
    events: [
      'billing_checkout_initiated', 'billing_portal_opened',
      'subscription_created', 'subscription_updated', 'subscription_cancelled',
      'payment_succeeded', 'payment_failed',
    ],
  },
  admin: {
    label: 'Admin',
    events: [
      'role_created', 'role_updated', 'role_deleted',
      'organization_created', 'organization_updated', 'organization_deleted',
      'subscription_plan_selected', 'subscription_plan_created', 'subscription_plan_updated', 'subscription_plan_deactivated',
      'kpi_definition_created', 'kpi_definition_updated', 'kpi_definition_toggled',
      'widget_template_created', 'widget_template_updated', 'widget_template_toggled',
      'kpi_pack_created', 'kpi_pack_updated', 'kpi_pack_toggled',
      'target_created', 'target_updated', 'target_deleted',
      'audit_logs_viewed', 'admin_users_listed', 'admin_organizations_listed',
    ],
  },
  nlq: {
    label: 'NLQ',
    events: ['nlq_executed', 'nlq_saved_to_dashboard'],
  },
};

// ─── StatusIcon ────────────────────────────────────────────────────────────────

function StatusIcon({ payload }: { payload?: Record<string, unknown> | null }) {
  const status = payload?.status;
  if (status === 'error') {
    return <AlertTriangle className="h-4 w-4 text-destructive" />;
  }
  if (status === 'success') {
    return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
  }
  return <Minus className="h-4 w-4 text-muted-foreground/40" />;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;

export function AuditLogsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(0);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({
    limit: PAGE_SIZE,
    offset: 0,
    startDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: logsResponse, isLoading, error } = useAuditLogs(filters);
  const { data: eventTypes = [] } = useAuditLogEventTypes();

  // Count events per category using data from /logs/audit/events
  const categoryCount = (key: CategoryKey): number => {
    if (key === 'all') return eventTypes.reduce((sum, et) => sum + et.count, 0);
    return eventTypes
      .filter((et) => CATEGORIES[key].events.includes(et.event))
      .reduce((sum, et) => sum + et.count, 0);
  };

  const handleCategoryChange = (key: CategoryKey) => {
    setActiveCategory(key);
    setFilters({
      limit: PAGE_SIZE,
      offset: 0,
      events: key !== 'all' ? CATEGORIES[key].events : undefined,
    });
    setCurrentPage(0);
  };

  const handleFiltersChange = (newFilters: AuditLogFilters) => {
    // If a specific event is selected, use it alone (no category events filter)
    // If no specific event, keep the category events filter
    const categoryEvents =
      activeCategory !== 'all' && !newFilters.event
        ? CATEGORIES[activeCategory].events
        : undefined;
    setFilters({ ...newFilters, events: categoryEvents });
    setCurrentPage(0);
  };

  const visibleRows = logsResponse?.data ?? [];

  const totalPages = Math.ceil((logsResponse?.meta?.total || 0) / PAGE_SIZE);
  const total = logsResponse?.meta?.total ?? 0;
  const firstEntry = currentPage * PAGE_SIZE + 1;
  const lastEntry = Math.min((currentPage + 1) * PAGE_SIZE, total);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    setFilters((f) => ({ ...f, offset: page * PAGE_SIZE }));
  };

  const handleExportCsv = () => {
    const logs = logsResponse?.data || [];
    if (logs.length === 0) return;

    const headers = ['Date', 'Événement', 'Statut', 'Utilisateur', 'Organisation', 'IP'];
    const rows = logs.map((log) => {
      const payload = log.payload as Record<string, unknown> | null | undefined;
      return [
        format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss'),
        log.event,
        payload?.status ?? '',
        log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
        log.organization?.name || 'N/A',
        log.ipAddress || '-',
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
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

  // Events available in the current category (for the dropdown)
  const categoryEvents =
    activeCategory === 'all' ? undefined : CATEGORIES[activeCategory].events;

  return (
    <div className="space-y-6" data-testid="audit-logs-page">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('auditLogs.title')}</h1>
        <p className="text-muted-foreground">{t('auditLogs.subtitle')}</p>
      </div>

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => handleCategoryChange(v as CategoryKey)}>
        <TabsList className="flex-wrap h-auto gap-1">
          {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => {
            const count = categoryCount(key);
            return (
              <TabsTrigger key={key} value={key} className="text-xs">
                {CATEGORIES[key].label}
                {count > 0 && (
                  <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

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
            categoryEvents={categoryEvents}
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
                      <TableHead className="w-[150px]">Date</TableHead>
                      <TableHead>Événement</TableHead>
                      <TableHead className="w-[70px] text-center">Statut</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Organisation</TableHead>
                      <TableHead className="w-[130px]">IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRows.map((log) => {
                      const payload = log.payload as Record<string, unknown> | null | undefined;
                      const isError = payload?.status === 'error';
                      return (
                        <TableRow
                          key={log.id}
                          className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                            isError ? 'bg-red-50/40 dark:bg-red-950/10' : ''
                          }`}
                          onClick={() => setSelectedLogId(log.id)}
                        >
                          <TableCell className="text-xs whitespace-nowrap font-mono text-muted-foreground">
                            {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <EventBadge event={log.event} />
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusIcon payload={payload} />
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.user
                              ? `${log.user.firstName} ${log.user.lastName}`
                              : <span className="text-muted-foreground italic text-xs">System</span>}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.organization?.name || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {log.ipAddress || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {visibleRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          {t('common.noData')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-muted-foreground">
                  {total > 0
                    ? `Entrées ${firstEntry}–${lastEntry} sur ${total} au total`
                    : '0 entrée'}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={currentPage === 0}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                    Page {currentPage + 1} / {Math.max(totalPages, 1)}
                  </span>
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail drawer */}
      <AuditLogDrawer
        logId={selectedLogId}
        onClose={() => setSelectedLogId(null)}
        onOpenDetail={(id) => navigate(`/audit-logs/${id}`)}
      />
    </div>
  );
}
