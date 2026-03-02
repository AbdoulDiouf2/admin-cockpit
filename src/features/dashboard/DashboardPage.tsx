import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Cpu, AlertTriangle } from 'lucide-react';

export function DashboardPage() {
  const { t } = useTranslation();

  // Stats data (will be fetched from API later)
  const stats = [
    { 
      label: t('dashboard.totalOrganizations'), 
      value: '24', 
      icon: Building2, 
      trend: '+2',
      color: 'text-blue-500' 
    },
    { 
      label: t('dashboard.totalUsers'), 
      value: '156', 
      icon: Users, 
      trend: '+12',
      color: 'text-green-500' 
    },
    { 
      label: t('dashboard.activeAgents'), 
      value: '18', 
      icon: Cpu, 
      trend: '+3',
      color: 'text-emerald-500' 
    },
    { 
      label: t('dashboard.errorAgents'), 
      value: '2', 
      icon: AlertTriangle, 
      trend: '-1',
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
                  <span className={stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
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
