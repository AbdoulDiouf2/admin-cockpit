import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Cpu, AlertTriangle, Loader2 } from 'lucide-react';
import { useDashboardStats } from '@/hooks/use-api';

export function DashboardPage() {
  const { t } = useTranslation();
  const { data: statsData, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[400px] flex items-center justify-center text-destructive">
        {t('dashboard.errorLoadingStats') || 'Erreur lors du chargement des statistiques'}
      </div>
    );
  }

  const stats = [
    {
      label: t('dashboard.totalOrganizations'),
      value: statsData?.organizations?.value?.toString() || '0',
      icon: Building2,
      trend: statsData?.organizations?.trend || '+0',
      color: 'text-blue-500'
    },
    {
      label: t('dashboard.totalUsers'),
      value: statsData?.users?.value?.toString() || '0',
      icon: Users,
      trend: statsData?.users?.trend || '+0',
      color: 'text-green-500'
    },
    {
      label: t('dashboard.activeAgents'),
      value: statsData?.activeAgents?.value?.toString() || '0',
      icon: Cpu,
      trend: statsData?.activeAgents?.trend || '+0',
      color: 'text-emerald-500'
    },
    {
      label: t('dashboard.errorAgents'),
      value: statsData?.errorAgents?.value?.toString() || '0',
      icon: AlertTriangle,
      trend: statsData?.errorAgents?.trend || '0',
      color: 'text-red-500'
    },
  ];

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} data-testid={`stat-card-${index}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className={stat.trend.startsWith('+') ? 'text-green-500' : stat.trend === '0' || stat.trend === '+0' ? 'text-muted-foreground' : 'text-red-500'}>
                    {stat.trend}
                  </span>
                  {' '}{t('dashboard.last30Days')}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="recent-activity-card">
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
            <CardDescription>{t('dashboard.last30Days')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
              Graphique d'activité à implémenter
            </div>
          </CardContent>
        </Card>

        <Card data-testid="agents-status-card">
          <CardHeader>
            <CardTitle>{t('dashboard.agentsStatus')}</CardTitle>
            <CardDescription>Répartition des statuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
              Graphique des agents à implémenter
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
