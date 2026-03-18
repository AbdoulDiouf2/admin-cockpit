import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Cpu, Key, Loader2, Circle, MoreHorizontal, RefreshCw, ShieldOff, Zap, Trash2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAgents } from '@/hooks/use-api';
import { Agent } from '@/types';
import { FilterBar } from '@/components/shared/FilterBar';
import { GenerateTokenModal } from './GenerateTokenModal';
import { RegenerateTokenModal } from './RegenerateTokenModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { agentsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

export function AgentsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [regenerateAgent, setRegenerateAgent] = useState<Agent | null>(null);
  const [revokeAgent, setRevokeAgent] = useState<Agent | null>(null);
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null);

  const [filterStatus, setFilterStatus] = useState('');
  const [filterOrg, setFilterOrg] = useState('');

  const { data: agents, isLoading, error, isFetching } = useAgents();

  const orgOptions = useMemo(() => {
    if (!agents) return [];
    const orgs = [...new Map(
      agents.filter((a) => a.organization).map((a) => [a.organization!.id, a.organization!.name])
    ).entries()];
    return orgs.sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => ({ label: name, value: id }));
  }, [agents]);

  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    return agents.filter((agent) => {
      if (filterOrg && agent.organization?.id !== filterOrg) return false;
      if (filterStatus === 'online' && (agent.status !== 'online' || agent.isRevoked)) return false;
      if (filterStatus === 'offline' && agent.status !== 'offline') return false;
      if (filterStatus === 'error' && agent.status !== 'error') return false;
      if (filterStatus === 'revoked' && !agent.isRevoked) return false;
      return true;
    });
  }, [agents, filterStatus, filterOrg]);

  const hasActiveFilters = filterStatus !== '' || filterOrg !== '';
  const resetFilters = () => { setFilterStatus(''); setFilterOrg(''); };

  const revokeMutation = useMutation({
    mutationFn: (id: string) => agentsApi.revokeToken(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents-status'] });
      toast({
        title: t('common.success'),
        description: t('agents.revokeTokenSuccess'),
      });
      setRevokeAgent(null);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('common.error'),
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents-status'] });
      toast({
        title: t('common.success'),
        description: t('agents.deleteSuccess'),
      });
      setDeleteAgent(null);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('common.error'),
        variant: 'destructive',
      });
    },
  });

  const getStatusColor = (agent: Agent) => {
    if (agent.isRevoked) return 'text-orange-500 fill-orange-500';
    switch (agent.status) {
      case 'online': return 'text-green-500 fill-green-500';
      case 'offline': return 'text-gray-400 fill-gray-400';
      case 'error': return 'text-destructive fill-destructive';
      default: return 'text-yellow-500 fill-yellow-500';
    }
  };

  const getStatusLabel = (agent: Agent) => {
    if (agent.isRevoked) return t('agents.revoked');
    switch (agent.status) {
      case 'online': return t('agents.online');
      case 'offline': return t('agents.offline');
      case 'error': return t('agents.error');
      default: return t('agents.pending');
    }
  };

  return (
    <div className="space-y-6" data-testid="agents-page">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('agents.title')}</h1>
          <p className="text-muted-foreground">{t('agents.subtitle')}</p>
        </div>
        <Button data-testid="generate-token-btn" onClick={() => setGenerateOpen(true)}>
          <Key className="h-4 w-4 mr-2" />
          {t('agents.generateToken')}
        </Button>
      </div>

      {/* Agents list */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                {t('agents.listTitle')}
              </CardTitle>
              <CardDescription>{t('agents.listSubtitle')}</CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className={`h-3 w-3 ${isFetching && !isLoading ? 'animate-spin' : ''}`} />
              {t('agents.pollingActive')}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="h-[400px] flex items-center justify-center text-destructive">
              Erreur lors du chargement des agents
            </div>
          ) : (
            <div className="space-y-3">
              <FilterBar
                filters={[
                  {
                    key: 'status',
                    label: t('common.status'),
                    options: [
                      { label: t('agents.online'), value: 'online' },
                      { label: t('agents.offline'), value: 'offline' },
                      { label: t('agents.error'), value: 'error' },
                      { label: t('agents.revoked'), value: 'revoked' },
                    ],
                    value: filterStatus,
                    onChange: setFilterStatus,
                  },
                  {
                    key: 'org',
                    label: 'Organisation',
                    options: orgOptions,
                    value: filterOrg,
                    onChange: setFilterOrg,
                  },
                ]}
                onReset={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Dernière activité</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">
                        <Link
                          to={`/agents/${agent.id}`}
                          className="text-primary hover:underline"
                        >
                          {agent.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Circle className={`h-2 w-2 ${getStatusColor(agent)}`} />
                          <span className="text-sm">{getStatusLabel(agent)}</span>
                          {agent.isSocketConnected && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                              <Zap className="h-2.5 w-2.5 fill-current" />
                              Temps Réel
                            </span>
                          )}
                          {agent.isExpiringSoon && !agent.isRevoked && (
                            <span className="text-xs text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded">
                              {t('agents.expiringSoon')}
                            </span>
                          )}
                        </div>
                        {agent.status === 'error' && agent.lastError && (
                          <p className="text-xs text-destructive mt-1 max-w-[200px] truncate">
                            {agent.lastError}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{agent.version || '—'}</TableCell>
                      <TableCell>
                        {agent.organization?.name || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {agent.lastSeen
                          ? format(new Date(agent.lastSeen), 'dd/MM/yyyy HH:mm')
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Ouvrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link to={`/agents/${agent.id}`}>
                                <Cpu className="mr-2 h-4 w-4" />
                                {t('common.viewDetails')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRegenerateAgent(agent)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              {t('agents.regenerateToken')}
                            </DropdownMenuItem>
                            {!agent.isRevoked && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setRevokeAgent(agent)}
                                >
                                  <ShieldOff className="mr-2 h-4 w-4" />
                                  {t('agents.revokeToken')}
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteAgent(agent)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAgents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {t('common.noData')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            </div>
          )}
        </CardContent>
      </Card>

      <GenerateTokenModal open={generateOpen} onOpenChange={setGenerateOpen} />

      <RegenerateTokenModal
        open={regenerateAgent !== null}
        onOpenChange={(open) => {
          if (!open) setRegenerateAgent(null);
        }}
        agent={regenerateAgent}
      />

      <ConfirmDialog
        open={revokeAgent !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeAgent(null);
        }}
        title={t('agents.revokeTokenConfirm')}
        description={t('agents.revokeTokenDesc')}
        onConfirm={() => revokeAgent && revokeMutation.mutate(revokeAgent.id)}
        isPending={revokeMutation.isPending}
        confirmLabel={t('agents.revokeToken')}
        cancelLabel={t('common.cancel')}
      />

      <ConfirmDialog
        open={deleteAgent !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteAgent(null);
        }}
        title={t('agents.deleteConfirmTitle')}
        description={t('agents.deleteConfirmDesc', { name: deleteAgent?.name })}
        onConfirm={() => deleteAgent && deleteMutation.mutate(deleteAgent.id)}
        isPending={deleteMutation.isPending}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="destructive"
      />
    </div>
  );
}
