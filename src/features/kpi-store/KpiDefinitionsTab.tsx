import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, MoreHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { kpiDefinitionsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { useKpiDefinitions } from '@/hooks/use-api';
import type { KpiDefinition } from '@/types';
import { useNavigate } from 'react-router-dom';
import { CreateKpiDefinitionModal } from './CreateKpiDefinitionModal';
import { EditKpiDefinitionModal } from './EditKpiDefinitionModal';

export function KpiDefinitionsTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editKpi, setEditKpi] = useState<KpiDefinition | null>(null);
  const [toggleKpi, setToggleKpi] = useState<KpiDefinition | null>(null);

  const { data: kpis, isLoading } = useKpiDefinitions();

  const toggleMutation = useMutation({
    mutationFn: (id: string) => kpiDefinitionsApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-definitions'] });
      toast({ title: t('common.success'), description: t('kpiStore.kpiToggleSuccess') });
      setToggleKpi(null);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('common.error'),
        variant: 'destructive',
      });
    },
  });

  const columns: ColumnDef<KpiDefinition>[] = [
    {
      accessorKey: 'key',
      header: t('kpiStore.kpiKey'),
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.getValue('key')}</code>
      ),
    },
    {
      accessorKey: 'name',
      header: t('kpiStore.kpiName'),
      cell: ({ row }) => (
        <Button
          variant="link"
          className="p-0 h-auto font-medium text-primary hover:underline justify-start"
          onClick={() => navigate(`/kpi-store/definitions/${row.original.id}`)}
        >
          {row.getValue('name')}
        </Button>
      ),
    },
    {
      accessorKey: 'unit',
      header: t('kpiStore.kpiUnit'),
      cell: ({ row }) => <span className="text-muted-foreground">{row.getValue('unit') || '—'}</span>,
    },
    {
      accessorKey: 'category',
      header: t('kpiStore.kpiCategory'),
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
          {row.getValue('category')}
        </span>
      ),
    },
    {
      accessorKey: 'defaultVizType',
      header: t('kpiStore.kpiVizType'),
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.getValue('defaultVizType')}</code>
      ),
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
        const kpi = row.original;
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
                <DropdownMenuItem onClick={() => navigate(`/kpi-store/definitions/${kpi.id}`)}>
                  Voir les détails
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditKpi(kpi)}>
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className={kpi.isActive ? 'text-destructive focus:text-destructive' : ''}
                  onClick={() => setToggleKpi(kpi)}
                >
                  {kpi.isActive ? t('kpiStore.deactivate') : t('kpiStore.activate')}
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
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('kpiStore.createKpi')}
        </Button>
      </div>

      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={kpis ?? []} searchKey="name" />
      )}

      <CreateKpiDefinitionModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <EditKpiDefinitionModal
        open={editKpi !== null}
        onOpenChange={(open) => { if (!open) setEditKpi(null); }}
        kpi={editKpi}
      />

      <ConfirmDialog
        open={toggleKpi !== null}
        onOpenChange={(open) => { if (!open) setToggleKpi(null); }}
        title={t('kpiStore.toggleConfirmTitle')}
        description={t('kpiStore.toggleConfirmDesc')}
        onConfirm={() => toggleKpi && toggleMutation.mutate(toggleKpi.id)}
        isPending={toggleMutation.isPending}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
