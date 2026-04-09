import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bug as BugIcon, Loader2, AlertCircle, Plus } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { bugTrackerApi } from './services/bugTrackerApi';
import { Bug, BugPriority, BugStatus } from './types';
import { format } from 'date-fns';
import { ColumnDef } from '@tanstack/react-table';

export function BugTrackerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');

  const { data: bugs, isLoading, error } = useQuery({
    queryKey: ['bugs'],
    queryFn: () => bugTrackerApi.getBugs(),
  });

  const filteredBugs = useMemo(() => {
    if (!bugs) return [];
    return bugs.filter((bug) => {
      if (filterStatus && bug.status !== filterStatus) return false;
      if (filterPriority && bug.priority !== filterPriority) return false;
      return true;
    });
  }, [bugs, filterStatus, filterPriority]);

  const columns: ColumnDef<Bug>[] = [
    {
      accessorKey: 'bugId',
      header: t('bugTracker.columnId'),
      cell: ({ row }) => <span className="font-mono text-xs">{row.getValue('bugId')}</span>,
    },
    {
      accessorKey: 'title',
      header: t('bugTracker.columnTitle'),
      cell: ({ row }) => (
        <Link 
          to={`/bug-tracker/${row.original.id}`}
          className="max-w-[400px] truncate font-medium text-primary hover:underline block"
        >
          {row.getValue('title')}
        </Link>
      ),
    },
    {
      accessorKey: 'entity_code',
      header: t('bugTracker.columnOrg'),
      cell: ({ row }) => {
        const orgName = row.original.organization?.name;
        const entityCode = row.getValue('entity_code') as string;
        
        if (orgName && entityCode) {
          return (
            <div className="flex flex-col">
              <span className="font-medium text-xs">{orgName}</span>
              <span className="text-[10px] text-muted-foreground">{entityCode}</span>
            </div>
          );
        }
        
        return <span className="text-xs">{orgName || entityCode || '—'}</span>;
      },
    },
    {
      accessorKey: 'priority',
      header: t('bugTracker.columnPriority'),
      cell: ({ row }) => {
        const priority = row.getValue('priority') as BugPriority;
        const variants: Record<BugPriority, string> = {
          critique: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50',
          haute: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50',
          moyenne: 'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/50',
          basse: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50',
          a_analyser: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700',
        };
        return (
          <Badge className={`${variants[priority]} capitalize`}>
            {t(`bugTracker.priority${priority.charAt(0).toUpperCase() + priority.slice(1).replace('_', '')}`)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'assignedTo',
      header: t('bugTracker.columnAssigned'),
      cell: ({ row }) => {
        const assignedTo = row.original.assignedTo;
        if (!assignedTo) return <span className="text-muted-foreground italic text-xs">Non assigné</span>;
        
        const name = (assignedTo as any).firstName || (assignedTo as any).lastName 
          ? `${(assignedTo as any).firstName || ''} ${(assignedTo as any).lastName || ''}`.trim()
          : (assignedTo as any).email || '—';
          
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'submittedBy',
      header: t('bugTracker.columnSubmitter'),
      cell: ({ row }) => {
        const submittedBy = row.original.submittedBy;
        if (!submittedBy) return '—';
        
        const name = (submittedBy as any).firstName || (submittedBy as any).lastName 
          ? `${(submittedBy as any).firstName || ''} ${(submittedBy as any).lastName || ''}`.trim()
          : (submittedBy as any).email || '—';
          
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs">{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: t('bugTracker.columnStatus'),
      cell: ({ row }) => {
        const status = row.getValue('status') as BugStatus;
        const variants: Record<BugStatus, string> = {
          nouveau: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
          en_analyse: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
          en_cours: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
          en_test: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
          resolu: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
          ferme: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
        };
        return (
          <Badge variant="outline" className={`${variants[status]} border-none`}>
            {t(`bugTracker.status${status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('bugTracker.columnSubmitted'),
      cell: ({ row }) => {
        const date = row.getValue('createdAt');
        return date ? format(new Date(date as string), 'dd/MM/yyyy HH:mm') : '—';
      },
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('bugTracker.title')}</h1>
          <p className="text-muted-foreground">{t('bugTracker.subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/bug-tracker/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {t('bugTracker.reportBug') || 'Signaler un bug'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BugIcon className="h-5 w-5" />
            {t('bugTracker.listTitle')}
          </CardTitle>
          <CardDescription>{t('bugTracker.listSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-destructive gap-2">
              <AlertCircle className="h-8 w-8" />
              <p>Erreur lors du chargement des bugs</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredBugs}
              searchPlaceholder="Rechercher par titre, ID, organisation..."
              extraFilters={
                <FilterBar
                  filters={[
                    {
                      key: 'status',
                      label: t('bugTracker.filterStatus'),
                      options: [
                        { label: t('bugTracker.statusNew'), value: 'nouveau' },
                        { label: t('bugTracker.statusAnalysis'), value: 'en_analyse' },
                        { label: t('bugTracker.statusInProgress'), value: 'en_cours' },
                        { label: t('bugTracker.statusTest'), value: 'en_test' },
                        { label: t('bugTracker.statusResolved'), value: 'resolu' },
                        { label: t('bugTracker.statusClosed'), value: 'ferme' },
                      ],
                      value: filterStatus,
                      onChange: setFilterStatus,
                    },
                    {
                      key: 'priority',
                      label: t('bugTracker.filterPriority'),
                      options: [
                        { label: t('bugTracker.priorityCritique'), value: 'critique' },
                        { label: t('bugTracker.priorityHaute'), value: 'haute' },
                        { label: t('bugTracker.priorityMoyenne'), value: 'moyenne' },
                        { label: t('bugTracker.priorityBasse'), value: 'basse' },
                        { label: t('bugTracker.priorityAnalyser'), value: 'a_analyser' },
                      ],
                      value: filterPriority,
                      onChange: setFilterPriority,
                    },
                  ]}
                  onReset={() => {
                    setFilterStatus('');
                    setFilterPriority('');
                  }}
                  hasActiveFilters={filterStatus !== '' || filterPriority !== ''}
                />
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
