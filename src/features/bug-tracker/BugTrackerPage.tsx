import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { useAuth } from '@/features/auth/AuthContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function BugTrackerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFilter = (searchParams.get('tab') as 'all' | 'active' | 'closed') || 'active';
  
  const setTabFilter = (value: string) => {
    setSearchParams(prev => {
      prev.set('tab', value);
      return prev;
    });
  };

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterAssigned, setFilterAssigned] = useState<string>('');

  const { data: bugs, isLoading, error } = useQuery({
    queryKey: ['bugs'],
    queryFn: () => bugTrackerApi.getBugs(),
  });

  const filteredBugs = useMemo(() => {
    if (!bugs) return [];
    return bugs.filter((bug) => {
      if (tabFilter === 'active' && (bug.status === 'resolu' || bug.status === 'ferme')) return false;
      if (tabFilter === 'closed' && (bug.status !== 'resolu' && bug.status !== 'ferme')) return false;
      
      if (filterStatus && bug.status !== filterStatus) return false;
      if (filterPriority && bug.priority !== filterPriority) return false;
      if (filterAssigned === 'me' && bug.assignedTo?.id !== currentUser?.id) return false;
      if (filterAssigned === 'unassigned' && bug.assignedTo) return false;
      return true;
    });
  }, [bugs, tabFilter, filterStatus, filterPriority, filterAssigned, currentUser]);

  const getRowClassName = (bug: Bug) => {
    if (bug.status === 'resolu' || bug.status === 'ferme') {
      return "opacity-60 bg-muted/20 select-none grayscale-[20%]";
    }
    return "";
  };

  const activeCount = useMemo(() => bugs?.filter(b => b.status !== 'resolu' && b.status !== 'ferme').length || 0, [bugs]);
  const closedCount = useMemo(() => bugs?.filter(b => b.status === 'resolu' || b.status === 'ferme').length || 0, [bugs]);
  const allCount = bugs?.length || 0;

  const columns = useMemo<ColumnDef<Bug>[]>(() => {
    const cols: ColumnDef<Bug>[] = [
      {
        accessorKey: 'bugId',
        header: t('bugTracker.columnId'),
        cell: ({ row }) => <span className="font-mono text-xs whitespace-nowrap">{row.getValue('bugId')}</span>,
      },
      {
        accessorKey: 'title',
        header: t('bugTracker.columnTitle'),
        cell: ({ row }) => (
          <Link 
            to={`/bug-tracker/${row.original.id}`}
            className="max-w-[250px] whitespace-normal line-clamp-2 font-medium text-primary hover:underline block text-xs"
          >
            {row.getValue('title')}
          </Link>
        ),
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
        accessorKey: 'assignedTo',
        header: t('bugTracker.columnAssigned'),
        cell: ({ row }) => {
          const assignedTo = row.original.assignedTo;
          if (!assignedTo) return <span className="text-muted-foreground italic text-xs">Non assigné</span>;
          
          const name = (assignedTo as any).firstName || (assignedTo as any).lastName 
            ? `${(assignedTo as any).firstName || ''} ${(assignedTo as any).lastName || ''}`.trim()
            : (assignedTo as any).email || '—';
            
          return (
            <div className="flex items-center gap-2 whitespace-nowrap">
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
          
          const name = `${submittedBy.firstName || ''} ${submittedBy.lastName || ''}`.trim() || submittedBy.email;
          return (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-xs">{name}</span>
            </div>
          );
        },
      },
    ];

    // 1. Informations d'assignation (Toujours présentes)
    cols.push(
      {
        accessorKey: 'assignedAt',
        header: 'Assigné le',
        cell: ({ row }) => {
          const date = row.original.assignedAt;
          return date ? <span className="whitespace-nowrap">{format(new Date(date), 'dd/MM/yyyy HH:mm')}</span> : '—';
        },
      },
      {
        accessorKey: 'assignedBy',
        header: 'Assigné par',
        cell: ({ row }) => {
          const assignedBy = row.original.assignedBy;
          const assignedToId = row.original.assignedToId;
          if (!assignedBy) return '—';
          
          if (assignedBy.id === assignedToId) {
            return <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">Auto</Badge>;
          }
          
          const name = `${assignedBy.firstName || ''} ${assignedBy.lastName || ''}`.trim() || assignedBy.email;
          return <span className="text-xs">{name}</span>;
        },
      }
    );

    // 2. Informations de résolution (Uniquement pour Clôturés ou Tous)
    if (tabFilter === 'closed' || tabFilter === 'all') {
      cols.push(
        {
          accessorKey: 'resolvedAt',
          header: 'Résolu le',
          cell: ({ row }) => {
            const date = row.original.resolvedAt;
            return date ? <span className="whitespace-nowrap">{format(new Date(date), 'dd/MM/yyyy HH:mm')}</span> : '—';
          },
        },
        {
          accessorKey: 'resolvedBy',
          header: 'Résolu par',
          cell: ({ row }) => {
            const resolvedBy = row.original.resolvedBy;
            if (!resolvedBy) return '—';
            const name = `${resolvedBy.firstName || ''} ${resolvedBy.lastName || ''}`.trim() || resolvedBy.email;
            return <span className="text-xs font-medium">{name}</span>;
          },
        }
      );
    }

    // 3. Date de soumission initiale (Toujours présente pour voir l'age du bug)
    cols.push({
      accessorKey: 'createdAt',
      header: t('bugTracker.columnSubmitted'),
      cell: ({ row }) => {
        const date = row.getValue('createdAt');
        return date ? <span className="whitespace-nowrap">{format(new Date(date as string), 'dd/MM/yyyy HH:mm')}</span> : '—';
      },
    });

    return cols;
  }, [tabFilter, t]);

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
            <Tabs defaultValue="active" value={tabFilter} onValueChange={(v) => setTabFilter(v as any)} className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="active" className="flex items-center gap-2">
                    Actifs (Ouverts)
                    <Badge variant="secondary" className="px-1.5 py-0 text-xs rounded-full font-normal hidden sm:inline-flex">{activeCount}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="closed" className="flex items-center gap-2">
                    Clôturés
                    <Badge variant="secondary" className="px-1.5 py-0 text-xs rounded-full font-normal hidden sm:inline-flex">{closedCount}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    Tous
                    <Badge variant="secondary" className="px-1.5 py-0 text-xs rounded-full font-normal hidden sm:inline-flex">{allCount}</Badge>
                  </TabsTrigger>
                </TabsList>
              </div>
              <DataTable
                columns={columns}
                data={filteredBugs}
                getRowClassName={getRowClassName}
                searchPlaceholder="Rechercher par titre, ID, organisation..."
                extraFilters={
                  <FilterBar
                    filters={[
                      {
                        key: 'status',
                        label: t('bugTracker.filterStatus'),
                        options: [
                          { label: t('bugTracker.statusNouveau'), value: 'nouveau' },
                          { label: t('bugTracker.statusEnAnalyse'), value: 'en_analyse' },
                          { label: t('bugTracker.statusEnCours'), value: 'en_cours' },
                          { label: t('bugTracker.statusEnTest'), value: 'en_test' },
                          { label: t('bugTracker.statusResolu'), value: 'resolu' },
                          { label: t('bugTracker.statusFerme'), value: 'ferme' },
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
                      {
                        key: 'assigned',
                        label: t('bugTracker.filterAssigned'),
                        options: [
                          { label: t('bugTracker.filterAssignedMe'), value: 'me' },
                          { label: t('bugTracker.filterAssignedUnassigned'), value: 'unassigned' },
                        ],
                        value: filterAssigned,
                        onChange: setFilterAssigned,
                      },
                    ]}
                    onReset={() => {
                      setFilterStatus('');
                      setFilterPriority('');
                      setFilterAssigned('');
                    }}
                    hasActiveFilters={filterStatus !== '' || filterPriority !== '' || filterAssigned !== ''}
                  />
                }
              />
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
