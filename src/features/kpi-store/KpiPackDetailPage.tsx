import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Package,
    CheckCircle2,
    XCircle,
    Pencil,
    BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useKpiPack, useKpiDefinitions } from '@/hooks/use-api';
import { kpiPacksApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { EditKpiPackModal } from './EditKpiPackModal';
import { Badge } from '@/components/ui/badge';

export function KpiPackDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isToggleOpen, setIsToggleOpen] = useState(false);

    const { data: pack, isLoading, error } = useKpiPack(id!);
    const { data: kpiDefinitions } = useKpiDefinitions();

    const toggleMutation = useMutation({
        mutationFn: (packId: string) => kpiPacksApi.toggle(packId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kpi-packs'] });
            queryClient.invalidateQueries({ queryKey: ['kpi-packs', id] });
            toast({ title: t('common.success'), description: t('kpiStore.packToggleSuccess') });
            setIsToggleOpen(false);
        },
        onError: (err: any) => {
            toast({
                title: t('common.error'),
                description: err.response?.data?.message || t('common.error'),
                variant: 'destructive',
            });
        },
    });

    if (isLoading) {
        return <LoadingSpinner fullScreen />;
    }

    if (error || !pack) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                <p className="text-destructive font-medium">{t('common.error')}</p>
                <Button onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('common.back')}
                </Button>
            </div>
        );
    }

    const includedKpis = kpiDefinitions?.filter(kpi => pack.kpiKeys.includes(kpi.key)) || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('common.back')}
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{pack.label}</h1>
                        <code className="text-sm bg-muted px-2 py-0.5 rounded text-primary">
                            {pack.name}
                        </code>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        {t('common.edit')}
                    </Button>
                    <Button
                        variant={pack.isActive ? 'destructive' : 'default'}
                        onClick={() => setIsToggleOpen(true)}
                    >
                        {pack.isActive ? t('kpiStore.deactivate') : t('kpiStore.activate')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            Détails du Pack
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('kpiStore.packLabel')}</p>
                                <p className="text-lg font-semibold">{pack.label}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('kpiStore.packName')}</p>
                                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">{pack.name}</code>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('kpiStore.packProfile')}</p>
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 uppercase">
                                    {pack.profile}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('common.status')}</p>
                                {pack.isActive ? (
                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        <CheckCircle2 className="h-3 w-3" />
                                        {t('kpiStore.active')}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                        <XCircle className="h-3 w-3" />
                                        {t('kpiStore.inactive')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {pack.description && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Description</p>
                                <p className="text-muted-foreground mt-1">{pack.description}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Contenu
                        </CardTitle>
                        <CardDescription>
                            {includedKpis.length} indicateur{includedKpis.length > 1 ? 's' : ''} inclus
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {includedKpis.map(kpi => (
                                <div key={kpi.key} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/kpi-store/definitions/${kpi.id}`)}>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{kpi.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{kpi.key}</span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] capitalize">
                                        {kpi.category}
                                    </Badge>
                                </div>
                            ))}
                            {includedKpis.length === 0 && (
                                <p className="text-sm text-muted-foreground italic">Aucun indicateur identifié.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {pack && (
                <EditKpiPackModal
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    pack={pack}
                />
            )}

            <ConfirmDialog
                open={isToggleOpen}
                onOpenChange={setIsToggleOpen}
                title={t('kpiStore.toggleConfirmTitle')}
                description={t('kpiStore.toggleConfirmDesc')}
                onConfirm={() => toggleMutation.mutate(pack.id)}
                isPending={toggleMutation.isPending}
                confirmLabel={t('common.confirm')}
                cancelLabel={t('common.cancel')}
            />
        </div>
    );
}
