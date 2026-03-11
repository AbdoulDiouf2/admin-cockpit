import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAgent, useAgentLogs, useAgentJobStats, useAgentJobs } from '@/hooks/use-api';
import { useSocket } from '@/hooks/use-socket';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Globe,
  Clock,
  Database,
  AlertCircle,
  Server,
  Key,
  Zap,
  Loader2,
  FileText,
  Activity,
  Search
} from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { format } from 'date-fns';
import { RegenerateTokenModal } from './RegenerateTokenModal';

const formatJobDuration = (ms: number) => {
  if (ms <= 0) return '0s';

  const totalSeconds = Math.floor(ms / 1000);
  const restMs = ms % 1000;
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  const parts = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  // Show seconds if anything larger exists, or if there are actual seconds
  if (hours > 0 || minutes > 0 || seconds > 0) {
    parts.push(`${seconds}s`);
  }

  if (restMs > 0) {
    if (parts.length === 0) {
      // If we only have ms, show 0s first to give context as requested earlier
      parts.push('0s');
    }
    parts.push(`${restMs}ms`);
  }

  return parts.join(' ');
};

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: agent, isLoading: isAgentLoading, error } = useAgent(id!);
  const { data: jobStats } = useAgentJobStats(id!);
  const { toast } = useToast();

  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [jobStatusFilter, setJobStatusFilter] = useState<string>('ALL');
  const [logsPage, setLogsPage] = useState(1);
  const [jobsPage, setJobsPage] = useState(1);
  const [searchLogs, setSearchLogs] = useState('');
  const [searchJobs, setSearchJobs] = useState('');
  const [debouncedSearchLogs, setDebouncedSearchLogs] = useState('');
  const [debouncedSearchJobs, setDebouncedSearchJobs] = useState('');

  // Debounce effect for logs
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchLogs(searchLogs), 500);
    return () => clearTimeout(timer);
  }, [searchLogs]);

  // Debounce effect for jobs
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchJobs(searchJobs), 500);
    return () => clearTimeout(timer);
  }, [searchJobs]);

  const { data: logData, isLoading: isLogsLoading } = useAgentLogs(id!, logsPage, 50, debouncedSearchLogs);
  const { data: jobsData, isLoading: isJobsLoading } = useAgentJobs(
    id!,
    jobsPage,
    20,
    jobStatusFilter === 'ALL' ? undefined : jobStatusFilter,
    debouncedSearchJobs
  );

  // Reset page when filters change
  useEffect(() => {
    setJobsPage(1);
  }, [jobStatusFilter, debouncedSearchJobs]);

  useEffect(() => {
    setLogsPage(1);
  }, [showErrorsOnly, debouncedSearchLogs]);

  // Real-time logs via WebSocket
  const { socket } = useSocket('cockpit');

  useEffect(() => {
    if (!socket || !id) return;

    const handleNewLog = (newLog: any) => {
      // Only add log if it belongs to this agent
      if (newLog.agentId === id) {
        // If searching, only add if it matches
        if (debouncedSearchLogs && !newLog.message.toLowerCase().includes(debouncedSearchLogs.toLowerCase())) {
          return;
        }

        queryClient.setQueryData(['agent-logs', id, logsPage, 50, debouncedSearchLogs], (oldData: any) => {
          if (!oldData) return { logs: [newLog], pagination: { total: 1, pages: 1, page: 1, limit: 50 } };

          // Only add to list if we are on page 1
          if (logsPage !== 1) return oldData;

          return {
            ...oldData,
            logs: [newLog, ...oldData.logs].slice(0, 50),
            pagination: {
              ...oldData.pagination,
              total: oldData.pagination.total + 1
            }
          };
        });
      }
    };

    socket.on('agent_log_received', handleNewLog);

    return () => {
      socket.off('agent_log_received', handleNewLog);
    };
  }, [socket, id, queryClient, logsPage, debouncedSearchLogs]);

  const isLoading = isAgentLoading; // Keep isLoading for the initial full-screen loading

  const testMutation = useMutation({
    mutationFn: () => agentsApi.testConnection(id!),
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: "Test de connexion réussi ! L'agent a répondu en temps réel.",
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || "L'agent n'a pas répondu au test temps réel.",
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <p className="text-destructive font-medium">{t('common.error')}</p>
        <Button onClick={() => navigate('/agents')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'offline': return 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
      case 'error': return 'text-destructive bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      default: return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return t('agents.online');
      case 'offline': return t('agents.offline');
      case 'error': return t('agents.error');
      default: return t('agents.pending');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/agents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{agent.name}</h1>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
            {getStatusLabel(agent.status)}
          </span>
          {agent.isSocketConnected && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-primary bg-primary/10 border border-primary/20 animate-pulse">
              <Zap className="h-3 w-3 fill-current" />
              Connexion Temps Réel Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending || !agent.isSocketConnected}
          >
            {testMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Tester le Temps Réel
          </Button>
          <Button variant="outline" onClick={() => setIsRegenerateOpen(true)}>
            <Key className="h-4 w-4 mr-2" />
            {t('agents.regenerateToken')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Connection details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              État de connexion
            </CardTitle>
            <CardDescription>Informations système et connectivité</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID Agent</p>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded mt-1 block w-fit">{agent.id}</code>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Version du Logiciel</p>
                <p className="font-medium mt-1">{agent.version || 'Non disponible'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dernière fois vu</p>
                <div className="flex items-center gap-1.5 mt-1 text-sm font-medium">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {agent.lastSeen ? format(new Date(agent.lastSeen), 'dd/MM/yyyy HH:mm:ss') : 'Jamais'}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lieu d'origine (Tenant)</p>
                <div className="flex items-center gap-1.5 mt-1 text-sm font-medium">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {agent.organization?.name || 'Inconnu'}
                </div>
              </div>
              <div className="sm:col-span-2 p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${agent.isSocketConnected ? 'bg-primary/20 text-primary' : 'bg-gray-200 text-gray-500'}`}>
                    <Zap className={`h-5 w-5 ${agent.isSocketConnected ? 'fill-current' : ''}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Tunnel Command & Control</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.isSocketConnected
                        ? 'Le canal WebSockets est actif. Les requêtes NLQ seront traitées instantanément.'
                        : 'L\'agent utilise le mode polling (30s). Le temps réel est indisponible.'}
                    </p>
                  </div>
                </div>
                {agent.isSocketConnected && (
                  <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase">Optimisé</span>
                )}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Job Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Requêtes exécutées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Total */}
            <div className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Total</span>
              <span className="text-2xl font-black">{(jobStats?.total ?? 0).toLocaleString()}</span>
            </div>

            {/* Par statut */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                  Complétées
                </span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {(jobStats?.COMPLETED ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-destructive inline-block" />
                  Échouées
                </span>
                <span className={`font-bold ${(jobStats?.FAILED ?? 0) > 0 ? 'text-destructive' : ''}`}>
                  {(jobStats?.FAILED ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                  En cours
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {(jobStats?.RUNNING ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-gray-400 inline-block" />
                  En attente
                </span>
                <span className="font-bold text-muted-foreground">
                  {(jobStats?.PENDING ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Dernier heartbeat : {agent.lastSeen ? format(new Date(agent.lastSeen), 'dd/MM/yyyy HH:mm:ss') : 'Jamais'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Token status */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Sécurité du Token
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiration</p>
                <p className="font-medium mt-1">
                  {agent.tokenExpiresAt ? format(new Date(agent.tokenExpiresAt), 'dd MMMM yyyy') : 'Permanent'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Statut Révocation</p>
                <div className="mt-1">
                  {agent.isRevoked ? (
                    <Badge variant="destructive">Révoqué</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Valide</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                {agent.isExpiringSoon && !agent.isRevoked && (
                  <div className="text-xs text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" /> Expire bientôt ({agent.daysUntilExpiry} jours)
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Card */}
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Dashboard d'activité (Logs)
              </CardTitle>
              <CardDescription>
                Consultez les événements remontés par l'agent
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrer les logs..."
                  className="pl-8 h-9 text-xs"
                  value={searchLogs}
                  onChange={(e) => setSearchLogs(e.target.value)}
                />
              </div>
              {(logData?.logs?.filter(l => l.level === 'error').length ?? 0) > 0 && (
                <button
                  onClick={() => setShowErrorsOnly(v => !v)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border transition-colors ${showErrorsOnly
                    ? 'bg-red-500/15 text-red-600 border-red-300 dark:text-red-400'
                    : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                    }`}
                >
                  <AlertCircle className="h-3 w-3" />
                  {logData?.logs?.filter(l => l.level === 'error').length} erreur(s)
                </button>
              )}
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                <Activity className="h-3 w-3" />
                Live Update
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-2">
              <span className="text-[10px] text-muted-foreground italic">
                Logs rafraîchis automatiquement toutes les 10s
              </span>
            </div>
            <div className="rounded-md border border-muted bg-black/5 dark:bg-white/5 overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto font-mono text-xs">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-muted z-10">
                    <tr className="text-left text-muted-foreground border-b border-muted">
                      <th className="p-2 font-bold w-40">Timestamp</th>
                      <th className="p-2 font-bold w-20">Niveau</th>
                      <th className="p-2 font-bold">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLogsLoading ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-muted-foreground italic">
                          Chargement des logs...
                        </td>
                      </tr>
                    ) : !logData?.logs?.length ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-muted-foreground italic">
                          Aucun log disponible pour cet agent.
                        </td>
                      </tr>
                    ) : (
                      logData.logs
                        .filter(log => !showErrorsOnly || log.level === 'error')
                        .map((log) => {
                          const isExpanded = expandedLogId === log.id;
                          const isError = log.level === 'error';
                          return (
                            <>
                              <tr
                                key={log.id}
                                className={`border-b border-muted/50 transition-colors ${isError ? 'cursor-pointer hover:bg-red-500/5' : 'hover:bg-muted/30'}`}
                                onClick={() => isError && setExpandedLogId(isExpanded ? null : log.id)}
                              >
                                <td className="p-2 text-muted-foreground whitespace-nowrap">
                                  {format(new Date(log.timestamp), 'dd/MM HH:mm:ss')}
                                </td>
                                <td className="p-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${isError ? 'bg-red-500/20 text-red-500' :
                                    log.level === 'warning' ? 'bg-yellow-500/20 text-yellow-500' :
                                      'bg-green-500/20 text-green-500'
                                    }`}>
                                    {log.level}
                                  </span>
                                </td>
                                <td className="p-2 break-all text-foreground/90 leading-relaxed font-sans">
                                  <span className={isError && !isExpanded ? 'line-clamp-1' : ''}>{log.message}</span>
                                  {isError && (
                                    <span className="ml-2 text-[10px] text-red-400 font-mono">{isExpanded ? '▲ réduire' : '▼ détails'}</span>
                                  )}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr key={`${log.id}-expanded`} className="border-b border-red-200/30 bg-red-500/5">
                                  <td colSpan={3} className="p-0">
                                    <pre className="p-3 text-xs text-red-500/90 whitespace-pre-wrap break-all font-mono leading-relaxed">
                                      {log.message}
                                    </pre>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
              {logData?.pagination && logData.pagination.pages > 1 && (
                <div className="flex items-center justify-between p-3 border-t bg-muted/20">
                  <span className="text-xs text-muted-foreground">
                    Page {logData.pagination.page} sur {logData.pagination.pages} ({logData.pagination.total} logs)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                      disabled={logData.pagination.page === 1}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogsPage(p => Math.min(logData.pagination.pages, p + 1))}
                      disabled={logData.pagination.page === logData.pagination.pages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Jobs Card */}
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Historique des Requêtes (Jobs)
              </CardTitle>
              <CardDescription>
                Détails des exécutions SQL passées sur l'agent
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={jobStatusFilter} onValueChange={setJobStatusFilter}>
                <SelectTrigger className="h-9 w-[150px] text-xs">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="RUNNING">En cours</SelectItem>
                  <SelectItem value="COMPLETED">Complétés</SelectItem>
                  <SelectItem value="FAILED">Échoués</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Chercher dans les requêtes SQL..."
                  className="pl-8 h-9 text-xs"
                  value={searchJobs}
                  onChange={(e) => setSearchJobs(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-muted overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto font-sans text-sm">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-muted z-10">
                    <tr className="text-left text-muted-foreground border-b border-muted">
                      <th className="p-3 font-bold w-32 text-[10px] uppercase">Créé</th>
                      <th className="p-3 font-bold w-32 text-[10px] uppercase">Début</th>
                      <th className="p-3 font-bold w-24 text-[10px] uppercase">Statut</th>
                      <th className="p-3 font-bold w-32 text-[10px] uppercase">Utilisateur</th>
                      <th className="p-3 font-bold text-[10px] uppercase">Requête SQL</th>
                      <th className="p-3 font-bold w-20 text-[10px] uppercase text-right">Durée</th>
                      <th className="p-3 font-bold w-12 text-[10px] uppercase text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {isJobsLoading ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                          Chargement des requêtes...
                        </td>
                      </tr>
                    ) : !jobsData?.jobs?.length ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground italic">
                          Aucune requête trouvée.
                        </td>
                      </tr>
                    ) : (
                      jobsData.jobs.map((job: any) => {
                        const isExpanded = expandedJobId === job.id;
                        const isFailed = job.status === 'FAILED';
                        const isSuccess = job.status === 'COMPLETED';

                        return (
                          <React.Fragment key={job.id}>
                            <tr
                              className={`border-b border-muted/50 transition-colors hover:bg-muted/30 ${isExpanded ? 'bg-muted/20' : ''}`}
                            >
                              <td className="p-3 text-muted-foreground whitespace-nowrap text-xs">
                                {format(new Date(job.createdAt), 'dd/MM HH:mm:ss')}
                              </td>
                              <td className="p-3 text-muted-foreground whitespace-nowrap text-xs">
                                {job.startedAt ? format(new Date(job.startedAt), 'HH:mm:ss.SSS') : '-'}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isFailed ? 'bg-red-500/10 text-red-500' :
                                  isSuccess ? 'bg-green-500/10 text-green-500' :
                                    job.status === 'RUNNING' ? 'bg-blue-500/10 text-blue-500' :
                                      'bg-gray-500/10 text-gray-400'
                                  }`}>
                                  {job.status === 'COMPLETED' ? 'SUCCÈS' :
                                    job.status === 'FAILED' ? 'ÉCHEC' :
                                      job.status === 'RUNNING' ? 'EN COURS' : 'ATTENTE'}
                                </span>
                              </td>
                              <td className="p-3 text-xs text-muted-foreground truncate max-w-[120px]">
                                {job.user ? `${job.user.firstName} ${job.user.lastName || ''}`.trim() : <span className="italic text-[10px] opacity-50">Système</span>}
                              </td>
                              <td className="p-3 font-mono text-xs">
                                <div className="line-clamp-1 max-w-xl text-muted-foreground">
                                  {job.sql}
                                </div>
                              </td>
                              <td className="p-3 text-right font-mono text-[10px]">
                                {job.startedAt && job.completedAt ? (
                                  <span className="text-primary font-bold">
                                    {formatJobDuration(new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime())}
                                  </span>
                                ) : job.startedAt ? (
                                  <span className="text-blue-500 animate-pulse italic">en cours...</span>
                                ) : '-'}
                              </td>
                              <td className="p-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                                >
                                  {isExpanded ? 'Masquer' : 'Détails'}
                                </Button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-muted/50 border-b border-muted">
                                <td colSpan={7} className="p-4 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Requête SQL</h4>
                                      <pre className="p-3 bg-black/5 dark:bg-white/5 rounded border border-muted text-xs font-mono whitespace-pre-wrap break-all">
                                        {job.sql}
                                      </pre>
                                    </div>
                                    <div className="space-y-2">
                                      {isFailed ? (
                                        <>
                                          <h4 className="text-xs font-bold uppercase tracking-wider text-destructive">Message d'erreur</h4>
                                          <div className="p-3 bg-destructive/5 dark:bg-destructive/10 rounded border border-destructive/20 text-sm text-destructive font-medium whitespace-pre-wrap">
                                            {job.errorMessage || 'Erreur inconnue (pas de message retourné)'}
                                          </div>
                                        </>
                                      ) : isSuccess ? (
                                        <>
                                          <h4 className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">Résultat</h4>
                                          <pre className="p-3 bg-green-500/5 rounded border border-green-500/20 text-xs font-mono overflow-auto max-h-[200px]">
                                            {JSON.stringify(job.result, null, 2)}
                                          </pre>
                                        </>
                                      ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground italic">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          Attente du résultat...
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-6 text-[10px] text-muted-foreground font-mono">
                                    <div>ID: {job.id}</div>
                                    {job.startedAt && <div>Début: {format(new Date(job.startedAt), 'HH:mm:ss.SSS')}</div>}
                                    {job.completedAt && <div>Fin: {format(new Date(job.completedAt), 'HH:mm:ss.SSS')}</div>}
                                    {job.startedAt && job.completedAt && (
                                      <div className="font-bold text-primary">
                                        Durée: {formatJobDuration(new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime())}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {jobsData?.pagination && jobsData.pagination.pages > 1 && (
                <div className="flex items-center justify-between p-3 border-t bg-muted/20">
                  <span className="text-xs text-muted-foreground">
                    Page {jobsData.pagination.page} sur {jobsData.pagination.pages} ({jobsData.pagination.total} jobs)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setJobsPage(p => Math.max(1, p - 1))}
                      disabled={jobsData.pagination.page === 1}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setJobsPage(p => Math.min(jobsData.pagination.pages, p + 1))}
                      disabled={jobsData.pagination.page === jobsData.pagination.pages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <RegenerateTokenModal
        open={isRegenerateOpen}
        onOpenChange={setIsRegenerateOpen}
        agent={agent}
      />
    </div >
  );
}

function Badge({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: 'default' | 'destructive' | 'secondary', className?: string }) {
  const variants = {
    default: 'bg-primary text-primary-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
    secondary: 'bg-secondary text-secondary-foreground'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
