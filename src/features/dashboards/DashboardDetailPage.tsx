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
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
                            {dashboard.widgets.map((widget) => (
                                <div key={widget.id} className="p-4 rounded-lg border bg-muted/30 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-bold text-sm truncate pr-2">{widget.name}</h3>
                                        {!widget.isActive && (
                                            <Badge variant="outline" className="text-[10px] h-4">Inactif</Badge>
                                        )}
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="text-muted-foreground">{t('clientDashboards.widgetType')}</div>
                                        <div className="font-medium text-right capitalize">{widget.type}</div>
                                        <div className="text-muted-foreground">{t('clientDashboards.widgetVisualization')}</div>
                                        <div className="font-medium text-right capitalize">{widget.vizType || '—'}</div>
                                    </div>
                                </div>
                            ))}
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
