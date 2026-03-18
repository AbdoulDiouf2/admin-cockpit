import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Loader2, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateOrganizationModal } from './CreateOrganizationModal';
import { EditOrganizationModal } from './EditOrganizationModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { DataTable } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { useOrganizations } from '@/hooks/use-api';
import { organizationsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { ColumnDef } from '@tanstack/react-table';
import { Organization } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function OrganizationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
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
    if (!organizations) return [];
    return organizations.filter((org) => {
      if (filterStatus === 'active' && !org.ownerId) return false;
      if (filterStatus === 'inactive' && !!org.ownerId) return false;
      if (filterPlan && org.subscriptionPlan?.name !== filterPlan) return false;
      return true;
    });
  }, [organizations, filterStatus, filterPlan]);

  const hasActiveFilters = filterStatus !== '' || filterPlan !== '';
  const resetFilters = () => { setFilterStatus(''); setFilterPlan(''); };

  const deleteMutation = useMutation({
    mutationFn: (orgId: string) => organizationsApi.delete(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: t('common.success'),
        description: t('organizations.deleteSuccess'),
      });
      setDeleteOrg(null);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('organizations.deleteError'),
        variant: 'destructive',
      });
    },
  });

  const columns: ColumnDef<Organization>[] = [
    {
      accessorKey: 'name',
      header: 'Nom',
      cell: ({ row }) => (
        <Link 
          to={`/organizations/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.getValue('name')}
        </Link>
      ),
    },
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <div className="text-sm font-mono text-muted-foreground truncate max-w-[180px]">
          {row.getValue('id')}
        </div>
      ),
    },
    {
      id: 'plan',
      header: 'Plan',
      cell: ({ row }) => {
        const label = row.original.subscriptionPlan?.label;
        return <span className="capitalize text-sm">{label || '—'}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: () => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Active
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Créée le',
      cell: ({ row }) => format(new Date(row.getValue('createdAt')), 'dd/MM/yyyy'),
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
                  <span className="sr-only">Ouvrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(org.id)}>
                  Copier l'ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setEditOrg(org)}>
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteOrg(org)}
                >
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
    <div className="space-y-6" data-testid="organizations-page">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('organizations.title')}</h1>
          <p className="text-muted-foreground">{t('organizations.subtitle')}</p>
        </div>
        <Button data-testid="create-org-btn" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('organizations.createClient')}
        </Button>
      </div>

      {/* Organizations list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('organizations.listTitle')}
          </CardTitle>
          <CardDescription>{t('organizations.listSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="h-[400px] flex items-center justify-center text-destructive">
              Erreur lors du chargement des organisations
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
                      key: 'status',
                      label: t('common.status'),
                      options: [
                        { label: t('organizations.statusActive'), value: 'active' },
                        { label: t('organizations.statusInactive'), value: 'inactive' },
                      ],
                      value: filterStatus,
                      onChange: setFilterStatus,
                    },
                    {
                      key: 'plan',
                      label: 'Plan',
                      options: planOptions,
                      value: filterPlan,
                      onChange: setFilterPlan,
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

      <CreateOrganizationModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
      <EditOrganizationModal
        open={editOrg !== null}
        onOpenChange={(open) => {
          if (!open) setEditOrg(null);
        }}
        organization={editOrg}
      />

      <ConfirmDialog
        open={deleteOrg !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteOrg(null);
        }}
        title={t('organizations.confirmDeleteTitle')}
        description={t('organizations.confirmDeleteDesc', { name: deleteOrg?.name ?? '' })}
        onConfirm={() => deleteOrg && deleteMutation.mutate(deleteOrg.id)}
        isPending={deleteMutation.isPending}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
