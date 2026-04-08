import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  AlertCircle,
  BarChart3,
  Tag,
  Hash,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useKpiHealthDetail } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { KpiHealthSession } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  Healthy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  Unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const JOB_STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  COMPLETED: { label: 'Succès', classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  FAILED: { label: 'Échec', classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  PENDING: { label: 'En attente', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  RUNNING: { label: 'En cours', classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  NO_JOB: { label: 'Sans job', classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2.5 border-b last:border-0">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="col-span-2 text-sm">{children}</div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className={cn('text-2xl font-bold mt-1', color ?? 'text-foreground')}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="p-2 rounded-lg bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function KpiHealthDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data, isLoading } = useKpiHealthDetail(id!);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!data) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="text-muted-foreground">{t('common.noData')}</p>
      <Button variant="outline" onClick={() => navigate('/kpi-health')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> {t('kpiHealth.backToList')}
      </Button>
    </div>
  );

  const { kpi, health, sessions } = data;

  // Unique orgs from sessions, with their best status
  const orgStats = Object.values(
    sessions.reduce<Record<string, { id: string; name: string; hasSuccess: boolean; hasFailure: boolean }>>(
      (acc, s) => {
        if (!s.organization) return acc;
        const { id, name } = s.organization;
        if (!acc[id]) acc[id] = { id, name, hasSuccess: false, hasFailure: false };
        if (s.jobStatus === 'COMPLETED') acc[id].hasSuccess = true;
        if (s.jobStatus === 'FAILED') acc[id].hasFailure = true;
        return acc;
      },
      {},
    ),
  ).sort((a, b) => a.name.localeCompare(b.name));

  const successRateColor =
    health.successRate === null ? ''
    : health.successRate >= 80 ? 'text-green-600 dark:text-green-400'
    : health.successRate >= 50 ? 'text-yellow-600 dark:text-yellow-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/kpi-health')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{kpi.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{kpi.key}</code>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  STATUS_COLORS[health.status],
                )}
              >
                {t(`kpiHealth.status${health.status}`)}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['kpi-health', id] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={BarChart3}
          label={t('kpiHealth.columnSuccessRate')}
          value={health.successRate !== null ? `${health.successRate}%` : '—'}
          sub={`${health.completedJobs} / ${health.totalJobs} jobs`}
          color={successRateColor}
        />
        <StatCard
          icon={Building2}
          label={t('kpiHealth.columnActiveOrgs')}
          value={health.activeOrganizations}
          sub={t('kpiHealth.orgsWithSuccess')}
        />
        <StatCard
          icon={CheckCircle2}
          label={t('kpiHealth.completedJobs')}
          value={health.completedJobs}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          icon={XCircle}
          label={t('kpiHealth.failedJobs')}
          value={health.totalJobs - health.completedJobs}
          color={health.totalJobs - health.completedJobs > 0 ? 'text-red-600 dark:text-red-400' : ''}
        />
      </div>

      {/* KPI Info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            {t('kpiHealth.kpiInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label={t('kpiStore.kpiCategory')}>{kpi.category}</InfoRow>
          {kpi.subcategory && <InfoRow label={t('kpiStore.kpiSubcategory')}>{kpi.subcategory}</InfoRow>}
          {kpi.description && <InfoRow label={t('kpiStore.kpiDescription')}>{kpi.description}</InfoRow>}
          {kpi.unit && <InfoRow label={t('kpiStore.kpiUnit')}>{kpi.unit}</InfoRow>}
          {kpi.frequency && <InfoRow label={t('kpiStore.kpiFrequency')}>{kpi.frequency}</InfoRow>}
          <InfoRow label={t('kpiStore.kpiVizType')}>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{kpi.defaultVizType}</code>
          </InfoRow>
          {kpi.profiles && kpi.profiles.length > 0 && (
            <InfoRow label={t('kpiStore.kpiProfiles')}>
              <div className="flex flex-wrap gap-1">
                {kpi.profiles.map((p) => (
                  <span key={p} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {p}
                  </span>
                ))}
              </div>
            </InfoRow>
          )}
          {orgStats.length > 0 && (
            <InfoRow label={t('kpiHealth.infoOrgs')}>
              <div className="flex flex-wrap gap-1.5">
                {orgStats.map((org) => (
                  <span
                    key={org.id}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border',
                      org.hasSuccess
                        ? 'bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                        : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
                    )}
                  >
                    {org.hasSuccess ? (
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                    ) : (
                      <XCircle className="h-3 w-3 shrink-0" />
                    )}
                    {org.name}
                  </span>
                ))}
              </div>
            </InfoRow>
          )}
          <InfoRow label={t('kpiHealth.infoKpiStore')}>
            <Button
              variant="link"
              className="p-0 h-auto text-xs text-primary hover:underline"
              onClick={() => navigate(`/kpi-store/definitions/${kpi.id}`)}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {t('kpiHealth.goToKpiStore')}
            </Button>
          </InfoRow>
        </CardContent>
      </Card>

      {/* Last error */}
      {health.lastError && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              {t('kpiHealth.lastErrorTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap bg-red-50 dark:bg-red-950/30 rounded p-3">
              {health.lastError}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Sessions history */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            {t('kpiHealth.sessionsTitle')} <span className="text-muted-foreground font-normal text-sm">({sessions.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('common.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t('kpiHealth.sessionDate')}</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t('kpiHealth.columnActiveOrgs')}</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t('common.status')}</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t('kpiHealth.sessionLatency')}</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">{t('kpiHealth.columnLastError')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s: KpiHealthSession) => {
                    const cfg = JOB_STATUS_CONFIG[s.jobStatus] ?? JOB_STATUS_CONFIG.NO_JOB;
                    return (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(s.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          {s.organization ? (
                            <span className="font-medium">{s.organization.name}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', cfg.classes)}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-xs">
                          {s.latencyMs !== null ? `${s.latencyMs} ms` : '—'}
                        </td>
                        <td className="px-4 py-2.5 max-w-[280px]">
                          {s.errorMessage ? (
                            <span className="text-xs text-red-600 dark:text-red-400 truncate block" title={s.errorMessage}>
                              {s.errorMessage}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
