import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, MoreHorizontal, Users, BarChart3 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { useOrganizations } from '@/hooks/use-api';
import { Organization } from '@/types';
import { EditOrganizationModal } from '../organizations/EditOrganizationModal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export function ClientPlansPage() {
    const { t } = useTranslation();
    const [editOrg, setEditOrg] = useState<Organization | null>(null);
    const [filterPlan, setFilterPlan] = useState('');
    const [filterFeature, setFilterFeature] = useState('');

    const { data: organizations, isLoading, error } = useOrganizations();

    const planOptions = useMemo(() => {
        if (!organizations) return [];
        const plans = [...new Set(organizations.map((o) => o.subscriptionPlan?.name).filter(Boolean))] as string[];
        return plans.sort().map((p) => ({
            label: organizations.find((o) => o.subscriptionPlan?.name === p)?.subscriptionPlan?.label || p,
            value: p,
        }));
    }, [organizations]);

    const filteredOrganizations = useMemo(() => {
        if (!organizations) return organizations ?? [];
        return organizations.filter((org) => {
            if (filterPlan && org.subscriptionPlan?.name !== filterPlan) return false;
            if (filterFeature === 'nlq' && !org.subscriptionPlan?.hasNlq) return false;
            if (filterFeature === 'reports' && !org.subscriptionPlan?.hasAdvancedReports) return false;
            return true;
        });
    }, [organizations, filterPlan, filterFeature]);

    const hasActiveFilters = filterPlan !== '' || filterFeature !== '';
    const resetFilters = () => { setFilterPlan(''); setFilterFeature(''); };

    const columns: ColumnDef<Organization>[] = [
        {
            accessorKey: 'name',
            header: t('clientPlans.organization'),
            cell: ({ row }) => (
                <div className="font-medium">{row.getValue('name')}</div>
            ),
        },
        {
            id: 'plan',
            header: t('clientPlans.plan'),
            cell: ({ row }) => {
                const plan = row.original.subscriptionPlan;
                const price = plan?.priceMonthly;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{plan?.label || t('clientPlans.noPlan')}</span>
                        <div className="flex items-center gap-2">
                            {plan?.name && (
                                <span className="text-[10px] text-muted-foreground uppercase bg-secondary px-1 rounded">{plan.name}</span>
                            )}
                            {price !== undefined && (
                                <span className="text-xs font-semibold text-primary">
                                    {price === null ? t('clientPlans.onQuote') : `${price}€/mois`}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'userUsage',
            header: t('clientPlans.usageUsers'),
            cell: ({ row }) => {
                const org = row.original;
                const activeUsers = org._count?.users || 0;
                const pendingInvitations = org._count?.invitations || 0;
                const current = activeUsers + pendingInvitations;
                const max = org.subscriptionPlan?.maxUsers;

                if (max === null || max === undefined) {
                    return <span className="text-sm font-medium">{current} / {t('clientPlans.unlimited')}</span>;
                }

                const percentage = Math.min((current / max) * 100, 100);
                const isNearLimit = percentage > 80;
                const isOverLimit = current > max;

                return (
                    <div className="w-[140px] space-y-1">
                        <div className="flex justify-between text-[10px] font-medium">
                            <span>{current} / {max} {t('clientPlans.users')}</span>
                            <span>{Math.round(percentage)}%</span>
                        </div>
                        <Progress
                            value={percentage}
                            className="h-1.5"
                            indicatorClassName={isOverLimit ? "bg-red-500" : isNearLimit ? "bg-orange-500" : undefined}
                        />
                    </div>
                );
            },
        },
        {
            id: 'kpiUsage',
            header: t('clientPlans.usageKpi'),
            cell: ({ row }) => {
                const plan = row.original.subscriptionPlan;
                const max = plan?.maxKpis;

                return (
                    <div className="flex items-center gap-1.5 text-sm">
                        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{max === null || max === undefined ? t('clientPlans.unlimited') : max}</span>
                    </div>
                );
            },
        },
        {
            id: 'widgetUsage',
            header: t('clientPlans.usageWidgets'),
            cell: ({ row }) => {
                const plan = row.original.subscriptionPlan;
                const max = plan?.maxWidgets;

                return (
                    <div className="flex items-center gap-1.5 text-sm">
                        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{max === null || max === undefined ? t('clientPlans.unlimited') : max}</span>
                    </div>
                );
            },
        },
        {
            id: 'features',
            header: t('clientPlans.features'),
            cell: ({ row }) => {
                const plan = row.original.subscriptionPlan;
                if (!plan) return null;

                return (
                    <div className="flex flex-wrap gap-1">
                        {plan.hasNlq && (
                            <Badge variant="outline" className="text-[10px] py-0 h-5 bg-blue-50 text-blue-700 border-blue-200">
                                AI / NLQ
                            </Badge>
                        )}
                        {plan.hasAdvancedReports && (
                            <Badge variant="outline" className="text-[10px] py-0 h-5 bg-purple-50 text-purple-700 border-purple-200">
                                Reports+
                            </Badge>
                        )}
                        {!plan.hasNlq && !plan.hasAdvancedReports && (
                            <span className="text-xs text-muted-foreground">—</span>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const org = row.original;
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setEditOrg(org)}>
                                    {t('clientPlans.changePlan')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => window.location.href = `/organizations/${org.id}`}>
                                    {t('organizations.viewDetails')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('clientPlans.title')}</h1>
                <p className="text-muted-foreground">{t('clientPlans.subtitle')}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {t('clientPlans.title')}
                    </CardTitle>
                    <CardDescription>
                        {t('clientPlans.subtitle')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="h-[400px] flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="h-[400px] flex items-center justify-center text-destructive">
                            Erreur lors du chargement des plans clients
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={filteredOrganizations}
                            searchKey="name"
                            extraFilters={
                                <FilterBar
                                    filters={[
                                        {
                                            key: 'plan',
                                            label: t('clientPlans.plan'),
                                            options: planOptions,
                                            value: filterPlan,
                                            onChange: setFilterPlan,
                                        },
                                        {
                                            key: 'feature',
                                            label: t('clientPlans.features'),
                                            options: [
                                                { label: 'AI / NLQ', value: 'nlq' },
                                                { label: 'Reports+', value: 'reports' },
                                            ],
                                            value: filterFeature,
                                            onChange: setFilterFeature,
                                        },
                                    ]}
                                    onReset={resetFilters}
                                    hasActiveFilters={hasActiveFilters}
                                />
                            }
                        />
                    )}
                </CardContent>
            </Card>

            <EditOrganizationModal
                open={editOrg !== null}
                onOpenChange={(open) => { if (!open) setEditOrg(null); }}
                organization={editOrg}
            />
        </div>
    );
}
