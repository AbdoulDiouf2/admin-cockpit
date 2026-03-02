import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Cpu, AlertTriangle, Loader2 } from 'lucide-react';
import { useDashboardStats } from '@/hooks/use-api';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

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

  // Fake data pour les graphiques si l'API ne renvoie rien pour ça
  const activityData = statsData?.recentActivity || [
    { date: '01/03', users: 12, agents: 5 },
    { date: '02/03', users: 19, agents: 8 },
    { date: '03/03', users: 15, agents: 7 },
    { date: '04/03', users: 22, agents: 10 },
    { date: '05/03', users: 28, agents: 12 },
    { date: '06/03', users: 24, agents: 9 },
    { date: '07/03', users: 32, agents: 14 },
  ];

  const agentsStatusData = statsData?.agentsDistribution || [
    { name: 'Online', value: statsData?.activeAgents?.value || 45, color: '#22c55e' }, // emerald-500
    { name: 'Offline', value: 12, color: '#94a3b8' }, // slate-400
    { name: 'Error', value: statsData?.errorAgents?.value || 3, color: '#ef4444' }, // red-500
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
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={activityData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAgents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} />
                  <YAxis className="text-xs" tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                  <Area
                    type="monotone"
                    name="Nouveaux utilisateurs"
                    dataKey="users"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    name="Agents déployés"
                    dataKey="agents"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorAgents)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="agents-status-card">
          <CardHeader>
            <CardTitle>{t('dashboard.agentsStatus')}</CardTitle>
            <CardDescription>Répartition des statuts actuels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={agentsStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {agentsStatusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
