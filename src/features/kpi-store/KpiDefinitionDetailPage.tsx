import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    BarChart3,
    CheckCircle2,
    XCircle,
    Pencil,
    Info,
    Database,
    Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useKpiDefinition } from '@/hooks/use-api';
import { kpiDefinitionsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { EditKpiDefinitionModal } from './EditKpiDefinitionModal';

export function KpiDefinitionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isToggleOpen, setIsToggleOpen] = useState(false);

    const { data: kpi, isLoading, error } = useKpiDefinition(id!);

    const toggleMutation = useMutation({
        mutationFn: (kpiId: string) => kpiDefinitionsApi.toggle(kpiId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kpi-definitions'] });
            queryClient.invalidateQueries({ queryKey: ['kpi-definitions', id] });
            toast({ title: t('common.success'), description: t('kpiStore.kpiToggleSuccess') });
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

    if (error || !kpi) {
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('common.back')}
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">{kpi.name}</h1>
                            {kpi.code && (
                                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                                    {kpi.code}
                                </span>
                            )}
                        </div>
                        <code className="text-sm bg-muted px-2 py-0.5 rounded text-primary">
                            {kpi.key}
                        </code>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        {t('common.edit')}
                    </Button>
                    <Button
                        variant={kpi.isActive ? 'destructive' : 'default'}
                        onClick={() => setIsToggleOpen(true)}
                    >
                        {kpi.isActive ? t('kpiStore.deactivate') : t('kpiStore.activate')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* ── Détails principaux ── */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-primary" />
                            Détails du KPI
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('kpiStore.kpiName')}</p>
                                <p className="font-semibold">{kpi.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('kpiStore.kpiKey')}</p>
                                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">{kpi.key}</code>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Domaine</p>
                                <p>{kpi.domain || '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('kpiStore.kpiCategory')}</p>
                                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                                    {kpi.category}
                                </span>
                                {kpi.subcategory && (
                                    <span className="ml-1 text-xs text-muted-foreground">/ {kpi.subcategory}</span>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('kpiStore.kpiUnit')}</p>
                                <p>{kpi.unit || '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('kpiStore.kpiVizType')}</p>
                                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">{kpi.defaultVizType}</code>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Fréquence</p>
                                <p>{kpi.frequency || '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Niveau de risque</p>
                                <p>{kpi.risk || '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Direction</p>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    kpi.direction === 'LOWER_IS_BETTER'
                                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                }`}>
                                    {kpi.direction === 'LOWER_IS_BETTER' ? '↓ Plus bas = meilleur' : '↑ Plus haut = meilleur'}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('common.status')}</p>
                                {kpi.isActive ? (
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

                        {kpi.description && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Description</p>
                                <p className="text-muted-foreground mt-1">{kpi.description}</p>
                            </div>
                        )}

                        {kpi.usage && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Usage métier</p>
                                <p className="text-muted-foreground mt-1 text-sm">{kpi.usage}</p>
                            </div>
                        )}

                        {(kpi.profiles?.length > 0 || kpi.sectors?.length > 0) && (
                            <div className="grid grid-cols-2 gap-4">
                                {kpi.profiles?.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Profils cibles</p>
                                        <div className="flex flex-wrap gap-1">
                                            {kpi.profiles.map((p) => (
                                                <span key={p} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {kpi.sectors?.length > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Secteurs</p>
                                        <div className="flex flex-wrap gap-1">
                                            {kpi.sectors.map((s) => (
                                                <span key={s} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Colonne droite ── */}
                <div className="space-y-6">
                    {/* Sage 100 */}
                    {(kpi.sqlSage100View || kpi.sqlSage100Tables?.length > 0) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Database className="h-4 w-4 text-primary" />
                                    Source Sage 100
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {kpi.sqlSage100View && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground">Vue principale</p>
                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded block mt-0.5">
                                            {kpi.sqlSage100View}
                                        </code>
                                    </div>
                                )}
                                {kpi.sqlSage100Tables?.length > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Tables sous-jacentes</p>
                                        <div className="flex flex-wrap gap-1">
                                            {kpi.sqlSage100Tables.map((tbl) => (
                                                <code key={tbl} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                    {tbl}
                                                </code>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ML / IA */}
                    {kpi.mlUsage && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Brain className="h-4 w-4 text-primary" />
                                    Usage ML / IA
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{kpi.mlUsage}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Usage générique si aucun des deux blocs ci-dessus */}
                    {!kpi.sqlSage100View && !kpi.sqlSage100Tables?.length && !kpi.mlUsage && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <BarChart3 className="h-4 w-4 text-primary" />
                                    Usage
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Ce KPI peut être inclus dans des packs et utilisé pour créer des widgets sur les tableaux de bord.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {kpi && (
                <EditKpiDefinitionModal
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    kpi={kpi}
                />
            )}

            <ConfirmDialog
                open={isToggleOpen}
                onOpenChange={setIsToggleOpen}
                title={t('kpiStore.toggleConfirmTitle')}
                description={t('kpiStore.toggleConfirmDesc')}
                onConfirm={() => toggleMutation.mutate(kpi.id)}
                isPending={toggleMutation.isPending}
                confirmLabel={t('common.confirm')}
                cancelLabel={t('common.cancel')}
            />
        </div>
    );
}
