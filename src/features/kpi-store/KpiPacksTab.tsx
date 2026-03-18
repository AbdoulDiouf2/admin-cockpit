import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { kpiPacksApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { useKpiPacks } from '@/hooks/use-api';
import type { KpiPack } from '@/types';
import { useNavigate } from 'react-router-dom';
import { CreateKpiPackModal } from './CreateKpiPackModal';
import { EditKpiPackModal } from './EditKpiPackModal';

interface KpiPacksTabProps {
  onCreateClick?: () => void;
}

export function KpiPacksTab({ onCreateClick }: KpiPacksTabProps = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editPack, setEditPack] = useState<KpiPack | null>(null);
  const [togglePack, setTogglePack] = useState<KpiPack | null>(null);

  const [filterProfile, setFilterProfile] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data: packs, isLoading } = useKpiPacks();

  const filteredPacks = useMemo(() => {
    if (!packs) return [];
    return packs.filter((p) => {
      if (filterProfile && p.profile !== filterProfile) return false;
      if (filterStatus === 'true' && !p.isActive) return false;
      if (filterStatus === 'false' && p.isActive) return false;
      return true;
    });
  }, [packs, filterProfile, filterStatus]);

  const hasActiveFilters = filterProfile !== '' || filterStatus !== '';
  const resetFilters = () => { setFilterProfile(''); setFilterStatus(''); };

  const toggleMutation = useMutation({
    mutationFn: (id: string) => kpiPacksApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-packs'] });
      toast({ title: t('common.success'), description: t('kpiStore.packToggleSuccess') });
      setTogglePack(null);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('common.error'),
        variant: 'destructive',
      });
    },
  });

  const columns: ColumnDef<KpiPack>[] = [
    {
      accessorKey: 'label',
      header: t('kpiStore.packLabel'),
      cell: ({ row }) => (
        <Button
          variant="link"
          className="p-0 h-auto font-medium text-primary hover:underline justify-start"
          onClick={() => navigate(`/kpi-store/packs/${row.original.id}`)}
        >
          {row.getValue('label')}
        </Button>
      ),
    },
    {
      accessorKey: 'name',
      header: t('kpiStore.packName'),
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.getValue('name')}</code>
      ),
    },
    {
      accessorKey: 'profile',
      header: t('kpiStore.packProfile'),
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 uppercase">
          {row.getValue('profile')}
        </span>
      ),
    },
    {
      id: 'kpiCount',
      header: t('kpiStore.packKpis'),
      cell: ({ row }) => {
        const keys = row.original.kpiKeys;
        return (
          <span className="text-sm">
            {keys.length} KPI{keys.length > 1 ? 's' : ''}
          </span>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: t('common.status'),
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean;
        return isActive ? (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            {t('kpiStore.active')}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            {t('kpiStore.inactive')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const pack = row.original;
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
                <DropdownMenuItem onClick={() => navigate(`/kpi-store/packs/${pack.id}`)}>
                  Voir les détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditPack(pack)}>
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className={pack.isActive ? 'text-destructive focus:text-destructive' : ''}
                  onClick={() => setTogglePack(pack)}
                >
                  {pack.isActive ? t('kpiStore.deactivate') : t('kpiStore.activate')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {!onCreateClick && (
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('kpiStore.createPack')}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredPacks}
          searchKey="label"
          extraFilters={
            <FilterBar
              filters={[
                {
                  key: 'profile',
                  label: t('kpiStore.packProfile'),
                  options: ['daf', 'dg', 'controller', 'manager', 'analyst'].map((p) => ({ label: p.toUpperCase(), value: p })),
                  value: filterProfile,
                  onChange: setFilterProfile,
                },
                {
                  key: 'status',
                  label: t('common.status'),
                  options: [
                    { label: t('kpiStore.active'), value: 'true' },
                    { label: t('kpiStore.inactive'), value: 'false' },
                  ],
                  value: filterStatus,
                  onChange: setFilterStatus,
                },
              ]}
              onReset={resetFilters}
              hasActiveFilters={hasActiveFilters}
            />
          }
        />
      )}

      <CreateKpiPackModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <EditKpiPackModal
        open={editPack !== null}
        onOpenChange={(open) => { if (!open) setEditPack(null); }}
        pack={editPack}
      />

      <ConfirmDialog
        open={togglePack !== null}
        onOpenChange={(open) => { if (!open) setTogglePack(null); }}
        title={t('kpiStore.toggleConfirmTitle')}
        description={t('kpiStore.toggleConfirmDesc')}
        onConfirm={() => togglePack && toggleMutation.mutate(togglePack.id)}
        isPending={toggleMutation.isPending}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
