import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { Activity, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { useKpiHealth } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import type { KpiHealthStat } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<KpiHealthStat['status'], string> = {
  Healthy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  Error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  Unknown: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function KpiHealthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: stats, isLoading } = useKpiHealth();
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const categories = useMemo(() => {
    if (!stats) return [];
    return [...new Set(stats.map((s) => s.category).filter(Boolean))].sort();
  }, [stats]);

  const filtered = useMemo(() => {
    if (!stats) return [];
    return stats.filter((s) => {
      if (filterCategory && s.category !== filterCategory) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      return true;
    });
  }, [stats, filterCategory, filterStatus]);

  const hasActiveFilters = filterCategory !== '' || filterStatus !== '';
  const resetFilters = () => {
    setFilterCategory('');
    setFilterStatus('');
  };

  const columns: ColumnDef<KpiHealthStat>[] = [
    {
      accessorKey: 'name',
      header: t('kpiHealth.columnKpi'),
      cell: ({ row }) => (
        <div>
          <Button
            variant="link"
            className="p-0 h-auto font-medium text-sm text-primary hover:underline justify-start"
            onClick={() => navigate(`/kpi-health/${row.original.id}`)}
          >
            {row.getValue('name')}
          </Button>
          <code className="block text-xs text-muted-foreground">{row.original.key}</code>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: t('kpiHealth.columnCategory'),
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
          {row.getValue('category')}
        </span>
      ),
    },
    {
      accessorKey: 'successRate',
      header: t('kpiHealth.columnSuccessRate'),
      cell: ({ row }) => {
        const rate = row.getValue('successRate') as number | null;
        const total = row.original.totalJobs;
        if (rate === null) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-full h-2 w-24">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500',
                )}
                style={{ width: `${rate}%` }}
              />
            </div>
            <span className="text-sm font-medium tabular-nums">{rate}%</span>
            <span className="text-xs text-muted-foreground">({total})</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'activeOrganizations',
      header: t('kpiHealth.columnActiveOrgs'),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{row.getValue('activeOrganizations')}</span>
      ),
    },
    {
      accessorKey: 'lastError',
      header: t('kpiHealth.columnLastError'),
      cell: ({ row }) => {
        const err = row.getValue('lastError') as string | null;
        if (!err) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <span
            className="text-xs text-red-600 dark:text-red-400 max-w-[200px] truncate block"
            title={err}
          >
            {err}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: t('common.status'),
      cell: ({ row }) => {
        const status = row.getValue('status') as KpiHealthStat['status'];
        return (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              STATUS_COLORS[status],
            )}
          >
            {t(`kpiHealth.status${status}`)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('kpiHealth.title')}</h1>
            <p className="text-muted-foreground text-sm">{t('kpiHealth.subtitle')}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['kpi-health'] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common.refresh')}
        </Button>
      </div>

      {/* Summary badges */}
      {stats && (
        <div className="flex flex-wrap gap-3">
          {(['Healthy', 'Warning', 'Error', 'Unknown'] as const).map((s) => {
            const count = stats.filter((k) => k.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all',
                  STATUS_COLORS[s],
                  filterStatus === s ? 'ring-2 ring-offset-1 ring-primary' : 'opacity-80 hover:opacity-100',
                )}
              >
                <span>{t(`kpiHealth.status${s}`)}</span>
                <span className="font-bold">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          searchKey="name"
          extraFilters={
            <FilterBar
              filters={[
                {
                  key: 'category',
                  label: t('kpiHealth.columnCategory'),
                  options: categories.map((c) => ({ label: c, value: c })),
                  value: filterCategory,
                  onChange: setFilterCategory,
                },
                {
                  key: 'status',
                  label: t('common.status'),
                  options: (
                    ['Healthy', 'Warning', 'Error', 'Unknown'] as KpiHealthStat['status'][]
                  ).map((s) => ({ label: t(`kpiHealth.status${s}`), value: s })),
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
    </div>
  );
}
