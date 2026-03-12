import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminDashboard } from '@/hooks/use-api';
import {
    ArrowLeft,
    Loader2,
    Building2,
    User,
    Calendar,
    Grid3X3,
    CheckCircle2,
    BarChart2,
    PieChart,
    Table2,
    LayoutGrid,
    KeyRound,
    Move,
    Settings2,
    Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const VIZ_ICON: Record<string, React.ReactNode> = {
    card: <LayoutGrid className="h-3.5 w-3.5" />,
    bar: <BarChart2 className="h-3.5 w-3.5" />,
    line: <Activity className="h-3.5 w-3.5" />,
    area: <Activity className="h-3.5 w-3.5" />,
    pie: <PieChart className="h-3.5 w-3.5" />,
    donut: <PieChart className="h-3.5 w-3.5" />,
    table: <Table2 className="h-3.5 w-3.5" />,
};

const VIZ_COLOR: Record<string, string> = {
    card: 'bg-blue-50 text-blue-700 border-blue-200',
    bar: 'bg-orange-50 text-orange-700 border-orange-200',
    line: 'bg-green-50 text-green-700 border-green-200',
    area: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pie: 'bg-purple-50 text-purple-700 border-purple-200',
    donut: 'bg-violet-50 text-violet-700 border-violet-200',
    table: 'bg-slate-50 text-slate-700 border-slate-200',
};

export function DashboardDetailPage() {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: dashboard, isLoading } = useAdminDashboard(id!);

    if (isLoading) {
        return (
            <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">{t('common.noData')}</p>
                <Button variant="link" onClick={() => navigate('/dashboards')}>
                    {t('common.back')}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboards')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{dashboard.name}</h1>
                    <p className="text-muted-foreground">{t('clientDashboards.detailsSubtitle')}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {dashboard.isDefault && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t('clientDashboards.columnDefault')}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {t('clientDashboards.columnOrg')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{dashboard.organization?.name}</div>
                        <p className="text-xs text-muted-foreground truncate">{dashboard.organizationId}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {t('clientDashboards.columnOwner')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            {dashboard.user?.firstName} {dashboard.user?.lastName}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{dashboard.user?.email}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {t('clientDashboards.columnDate')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            {format(new Date(dashboard.createdAt), 'dd MMMM yyyy', { locale: fr })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {format(new Date(dashboard.createdAt), 'HH:mm')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Résumé par vizType */}
            {dashboard.widgets && dashboard.widgets.length > 0 && (() => {
                const activeCount = dashboard.widgets.filter(w => w.isActive).length;
                const byViz = dashboard.widgets.reduce<Record<string, number>>((acc, w) => {
                    const key = w.vizType || w.type || 'inconnu';
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                }, {});
                return (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardContent className="pt-4 pb-3">
                                <div className="text-2xl font-bold">{dashboard.widgets.length}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">Widgets total</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4 pb-3">
                                <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">Actifs</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4 pb-3">
                                <div className="text-2xl font-bold text-slate-400">{dashboard.widgets.length - activeCount}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">Inactifs</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4 pb-3">
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {Object.entries(byViz).map(([viz, count]) => (
                                        <span key={viz} className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${VIZ_COLOR[viz] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                            {VIZ_ICON[viz] || null} {viz} ×{count}
                                        </span>
                                    ))}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">Répartition</div>
                            </CardContent>
                        </Card>
                    </div>
                );
            })()}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Grid3X3 className="h-5 w-5 text-primary" />
                        {t('clientDashboards.widgetsTitle')}
                    </CardTitle>
                    <CardDescription>
                        {dashboard.widgets?.length || 0} {t('clientDashboards.columnWidgets').toLowerCase()}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {dashboard.widgets && dashboard.widgets.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {dashboard.widgets.map((widget) => {
                                const vizKey = widget.vizType || widget.type || '';
                                const pos = widget.position as { x?: number; y?: number; w?: number; h?: number } | null;
                                const configKeys = widget.config ? Object.keys(widget.config).filter(k => widget.config[k] != null && widget.config[k] !== '') : [];
                                return (
                                    <div key={widget.id} className="p-4 rounded-lg border bg-card space-y-3 hover:border-primary/40 transition-colors">
                                        {/* En-tête */}
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-sm leading-tight">{widget.name}</h3>
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${VIZ_COLOR[vizKey] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                    {VIZ_ICON[vizKey] || null}
                                                    {vizKey || '—'}
                                                </span>
                                                {!widget.isActive && (
                                                    <Badge variant="outline" className="text-[10px] h-5 text-slate-400">Inactif</Badge>
                                                )}
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* KPI lié */}
                                        <div className="flex items-center gap-2 text-xs">
                                            <KeyRound className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                            {widget.exposure ? (
                                                <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-primary truncate">{widget.exposure}</code>
                                            ) : (
                                                <span className="text-muted-foreground italic">Aucun KPI lié</span>
                                            )}
                                        </div>

                                        {/* Position */}
                                        {pos && (pos.x != null || pos.w != null) && (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Move className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span>
                                                    x:{pos.x ?? '?'} y:{pos.y ?? '?'} &nbsp;·&nbsp; {pos.w ?? '?'}×{pos.h ?? '?'} colonnes
                                                </span>
                                            </div>
                                        )}

                                        {/* Config */}
                                        {configKeys.length > 0 && (
                                            <div className="text-xs">
                                                <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                                                    <Settings2 className="h-3.5 w-3.5" />
                                                    <span>Config</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {configKeys.slice(0, 4).map(k => (
                                                        <div key={k} className="flex justify-between gap-2">
                                                            <span className="text-muted-foreground capitalize">{k}</span>
                                                            <span className="font-medium text-right truncate max-w-[120px]">{String(widget.config[k])}</span>
                                                        </div>
                                                    ))}
                                                    {configKeys.length > 4 && (
                                                        <span className="text-muted-foreground text-[10px]">+{configKeys.length - 4} autres…</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Type interne */}
                                        <div className="text-[10px] text-muted-foreground pt-1 border-t">
                                            type: <span className="font-mono">{widget.type}</span>
                                            &nbsp;·&nbsp; id: <span className="font-mono truncate">{widget.id.slice(0, 8)}…</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-10 text-center text-muted-foreground">
                            {t('clientDashboards.noWidgets')}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
