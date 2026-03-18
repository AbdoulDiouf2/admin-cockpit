import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Trash2, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FilterBar } from '@/components/shared/FilterBar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { dashboardsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { useAdminDashboards } from '@/hooks/use-api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Dashboard } from '@/types';
import { Badge } from '@/components/ui/badge';

export function DashboardsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [deleteDashboard, setDeleteDashboard] = useState<Dashboard | null>(null);
    const [filterOrg, setFilterOrg] = useState('');
    const [filterOwner, setFilterOwner] = useState('');

    const { data: dashboards, isLoading } = useAdminDashboards();

    const orgOptions = useMemo(() => {
        if (!dashboards) return [];
        const orgs = [...new Map(
            dashboards.filter((d) => d.organization).map((d) => [d.organization!.id, d.organization!.name])
        ).entries()];
        return orgs.sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => ({ label: name, value: id }));
    }, [dashboards]);

    const ownerOptions = useMemo(() => {
        if (!dashboards) return [];
        const owners = [...new Map(
            dashboards.filter((d) => d.user).map((d) => [d.user!.id, `${d.user!.firstName} ${d.user!.lastName}`])
        ).entries()];
        return owners.sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => ({ label: name, value: id }));
    }, [dashboards]);

    const filteredDashboards = useMemo(() => {
        if (!dashboards) return [];
        return dashboards.filter((d) => {
            if (filterOrg && d.organization?.id !== filterOrg) return false;
            if (filterOwner && d.user?.id !== filterOwner) return false;
            return true;
        });
    }, [dashboards, filterOrg, filterOwner]);

    const hasActiveFilters = filterOrg !== '' || filterOwner !== '';
    const resetFilters = () => { setFilterOrg(''); setFilterOwner(''); };

    const deleteMutation = useMutation({
        mutationFn: (id: string) => dashboardsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-dashboards'] });
            toast({
                title: t('common.success'),
                description: t('clientDashboards.deleteSuccess')
            });
            setDeleteDashboard(null);
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: error.response?.data?.message || t('clientDashboards.deleteError'),
                variant: 'destructive',
            });
        },
    });

    const columns: ColumnDef<Dashboard>[] = [
        {
            accessorKey: 'name',
            header: t('clientDashboards.columnName'),
            cell: ({ row }) => (
                <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-primary hover:underline justify-start"
                    onClick={() => navigate(`/dashboards/${row.original.id}`)}
                >
                    {row.getValue('name')}
                </Button>
            ),
        },
        {
            id: 'organization',
            header: t('clientDashboards.columnOrg'),
            cell: ({ row }) => row.original.organization?.name || '—',
        },
        {
            id: 'owner',
            header: t('clientDashboards.columnOwner'),
            cell: ({ row }) => {
                const user = row.original.user;
                if (!user) return '—';
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                );
            },
        },
        {
            id: 'widgets',
            header: t('clientDashboards.columnWidgets'),
            cell: ({ row }) => (
                <Badge variant="secondary">
                    {row.original._count?.widgets || 0}
                </Badge>
            ),
        },
        {
            accessorKey: 'isDefault',
            header: t('clientDashboards.columnDefault'),
            cell: ({ row }) => {
                const isDefault = row.getValue('isDefault') as boolean;
                return isDefault ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/30" />
                );
            },
        },
        {
            accessorKey: 'createdAt',
            header: t('clientDashboards.columnDate'),
            cell: ({ row }) => format(new Date(row.getValue('createdAt')), 'dd MMM yyyy', { locale: fr }),
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const dashboard = row.original;
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Ouvrir menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => navigate(`/dashboards/${dashboard.id}`)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    {t('common.view')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteDashboard(dashboard)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {t('common.delete')}
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
                <h1 className="text-2xl font-bold tracking-tight">{t('clientDashboards.title')}</h1>
                <p className="text-muted-foreground">{t('clientDashboards.subtitle')}</p>
            </div>

            <div className="rounded-md border bg-card">
                {isLoading ? (
                    <div className="h-[400px] flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={filteredDashboards}
                        searchKey="name"
                        extraFilters={
                            <FilterBar
                                filters={[
                                    {
                                        key: 'org',
                                        label: t('clientDashboards.columnOrg'),
                                        options: orgOptions,
                                        value: filterOrg,
                                        onChange: setFilterOrg,
                                    },
                                    {
                                        key: 'owner',
                                        label: t('clientDashboards.columnOwner'),
                                        options: ownerOptions,
                                        value: filterOwner,
                                        onChange: setFilterOwner,
                                    },
                                ]}
                                onReset={resetFilters}
                                hasActiveFilters={hasActiveFilters}
                            />
                        }
                    />
                )}
            </div>

            <ConfirmDialog
                open={deleteDashboard !== null}
                onOpenChange={(open) => { if (!open) setDeleteDashboard(null); }}
                title={t('clientDashboards.confirmDeleteTitle')}
                description={t('clientDashboards.confirmDeleteDesc', { name: deleteDashboard?.name })}
                onConfirm={() => deleteDashboard && deleteMutation.mutate(deleteDashboard.id)}
                isPending={deleteMutation.isPending}
                confirmLabel={t('common.delete')}
                variant="destructive"
            />
        </div>
    );
}
