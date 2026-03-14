import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  Users,
  Cpu,
  AlertTriangle,
  Loader2,
  Store,
  Database,
  Layers,
  Zap,
  Search,
  History,
  Info,
  Shield,
  Key,
  LogOut,
  UserPlus,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/use-api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

const EVENT_META: Record<string, { label: string; icon: any; color: string }> = {
  user_login: { label: 'Connexion', icon: Zap, color: 'text-blue-500' },
  user_logout: { label: 'Déconnexion', icon: LogOut, color: 'text-slate-500' },
  user_created: { label: 'Utilisateur créé', icon: UserPlus, color: 'text-green-500' },
  user_updated: { label: 'Utilisateur modifié', icon: RefreshCw, color: 'text-amber-500' },
  user_deleted: { label: 'Utilisateur supprimé', icon: Trash2, color: 'text-red-500' },
  user_invited: { label: 'Invitation envoyée', icon: Shield, color: 'text-purple-500' },
  role_created: { label: 'Rôle créé', icon: Shield, color: 'text-green-500' },
  role_updated: { label: 'Rôle modifié', icon: Shield, color: 'text-amber-500' },
  role_deleted: { label: 'Rôle supprimé', icon: Shield, color: 'text-red-500' },
  organization_created: { label: 'Organisation créée', icon: Building2, color: 'text-green-500' },
  organization_updated: { label: 'Organisation modifiée', icon: Building2, color: 'text-amber-500' },
  agent_registered: { label: 'Agent connecté', icon: Cpu, color: 'text-blue-500' },
  agent_token_generated: { label: 'Token généré', icon: Key, color: 'text-indigo-500' },
  agent_token_regenerated: { label: 'Token régénéré', icon: RefreshCw, color: 'text-orange-500' },
  agent_error: { label: 'Erreur agent', icon: AlertTriangle, color: 'text-red-500' },
  password_reset_requested: { label: 'Reset MDP demandé', icon: Key, color: 'text-orange-500' },
  password_reset_completed: { label: 'MDP réinitialisé', icon: Shield, color: 'text-green-500' },
};

function formatPayload(payload: any): string {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  if (payload.name) return payload.name;
  if (payload.organizationName) return payload.organizationName;
  if (payload.email) return payload.email;
  if (payload.label) return payload.label;
  if (payload.firstName || payload.lastName) {
    return `${payload.firstName || ''} ${payload.lastName || ''}`.trim();
  }
  return '';
}

export function DashboardPage() {

  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const mainStats = [
    {
      label: t('dashboard.totalOrganizations'),
      value: statsData?.organizations?.value || 0,
      icon: Building2,
      trend: statsData?.organizations?.trend || '+0',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      href: '/organizations',
    },
    {
      label: t('dashboard.totalUsers'),
      value: statsData?.users?.value || 0,
      icon: Users,
      trend: statsData?.users?.trend || '+0',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      href: '/users',
    },
    {
      label: t('dashboard.activeAgents'),
      value: statsData?.activeAgents?.value || 0,
      icon: Cpu,
      trend: statsData?.activeAgents?.trend || '+0',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      href: '/agents',
    },
    {
      label: t('dashboard.errorAgents'),
      value: statsData?.errorAgents?.value || 0,
      icon: AlertTriangle,
      trend: statsData?.errorAgents?.trend || '0',
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      href: '/agents',
    },
  ];

  return (
    <div className="space-y-6 pb-10" data-testid="dashboard-page">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="overflow-hidden border-none shadow-md cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => navigate(stat.href)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </CardTitle>
                <div className={`p-2 rounded-xl ${stat.bg}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tracking-tight">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <span className={`font-bold ${stat.trend.startsWith('+') ? 'text-green-500' : stat.trend === '0' || stat.trend === '+0' ? 'text-muted-foreground' : 'text-red-500'}`}>
                    {stat.trend}
                  </span>
                  {t('dashboard.last30Days')}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* KPI & NLQ Store Inventory */}
        <Card className="md:col-span-1 lg:col-span-1 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="h-5 w-5 text-primary" />
              Inventaire Store
            </CardTitle>
            <CardDescription>Contenu global du catalogue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div
                className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => navigate('/kpi-store?tab=definitions')}
              >
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">KPIs</span>
                </div>
                <Badge variant="secondary" className="font-bold">{statsData?.inventory?.kpis || 0}</Badge>
              </div>
              <div
                className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => navigate('/kpi-store?tab=packs')}
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Packs</span>
                </div>
                <Badge variant="secondary" className="font-bold">{statsData?.inventory?.packs || 0}</Badge>
              </div>
              <div
                className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => navigate('/kpi-store?tab=templates')}
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Widgets</span>
                </div>
                <Badge variant="secondary" className="font-bold">{statsData?.inventory?.widgets || 0}</Badge>
              </div>
              <div
                className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => navigate('/nlq-store?tab=intents')}
              >
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">NLQ Intents</span>
                </div>
                <Badge variant="secondary" className="font-bold">{statsData?.inventory?.intents || 0}</Badge>
              </div>
            </div>
            <div
              className="pt-2 text-xs text-muted-foreground flex items-center gap-1.5 px-1 cursor-pointer hover:text-foreground transition-colors"
              onClick={() => navigate('/nlq-store?tab=templates')}
            >
              <Info className="h-3 w-3" />
              Total de {statsData?.inventory?.nlqTemplates || 0} templates SQL configurés.
            </div>
          </CardContent>
        </Card>

        {/* Activity Chart */}
        <Card className="md:col-span-2 lg:col-span-3 overflow-hidden">
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
            <CardDescription>{t('dashboard.last30Days')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={statsData?.recentActivity || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAgents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tickLine={false} axisLine={false} />
                  <YAxis className="text-xs" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                  <Area
                    type="monotone"
                    name="Nouveaux utilisateurs"
                    dataKey="users"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    name="Agents déployés"
                    dataKey="agents"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorAgents)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Status + Sectors */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Agent Status Donut */}
        <Card className="lg:col-span-1 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/agents')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Statut des Agents
            </CardTitle>
            <CardDescription>Répartition online / offline / erreur</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statsData?.agentsDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statsData?.agentsDistribution?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sectors Bar Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Secteurs d'activité</CardTitle>
            <CardDescription>Répartition des organisations par secteur</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData?.sectorDistribution || []} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tickLine={false} axisLine={false} angle={-30} textAnchor="end" interval={0} />
                  <YAxis className="text-xs" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" name="Organisations" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Funnel + Agent Jobs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Onboarding Funnel */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle>Funnel Onboarding</CardTitle>
            <CardDescription>Organisations bloquées par étape (wizard non complété)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData?.onboardingFunnel || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="step" className="text-xs" tickLine={false} axisLine={false} />
                  <YAxis className="text-xs" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="bloquées" name="Bloquées" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="complétées" name="Complétées" fill="#22c55e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Agent Jobs Santé */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Jobs Agent</CardTitle>
            <CardDescription>Statut des exécutions (7 derniers jours)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statsData?.agentJobsStats || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statsData?.agentJobsStats?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Plans Distribution */}
        <Card
          className="lg:col-span-1 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/subscription-plans')}
        >
          <CardHeader>
            <CardTitle>Répartition des Plans</CardTitle>
            <CardDescription>Par nombre d'organisations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statsData?.plansDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statsData?.plansDistribution?.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Audit Logs */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Activité Récente
              </CardTitle>
              <CardDescription>Dernières actions administratives</CardDescription>
            </div>
            <button
              className="text-xs text-primary hover:underline font-medium"
              onClick={() => navigate('/audit-logs')}
            >
              Voir tout →
            </button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-4">
                {statsData?.recentAuditLogs?.map((log: any) => {
                  const meta = EVENT_META[log.event] || { label: log.event, icon: History, color: 'text-primary' };
                  const Icon = meta.icon;
                  const details = formatPayload(log.payload);

                  return (
                    <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all cursor-pointer" onClick={() => navigate('/audit-logs')}>
                      <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0`}>
                        <Icon className={`h-5 w-5 ${meta.color}`} />
                      </div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm truncate">
                            {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Système'}
                          </span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(log.createdAt), 'dd MMM HH:mm', { locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4 shrink-0 transition-colors group-hover:bg-primary/5">
                            {meta.label}
                          </Badge>
                          <span className="truncate">{details || (log.event.includes('login') ? 'Session démarrée' : 'Action effectuée')}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
                {(!statsData?.recentAuditLogs || statsData?.recentAuditLogs.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <History className="h-8 w-8 mb-2 opacity-20" />
                    <p>Aucune activité récente</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
