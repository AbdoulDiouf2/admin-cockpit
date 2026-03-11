import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAgent, useAgentLogs } from '@/hooks/use-api';
import { useSocket } from '@/hooks/use-socket';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Globe,
  Clock,
  Database,
  AlertCircle,
  CheckCircle2,
  Server,
  Key,
  Zap,
  Loader2,
  FileText,
  Activity
} from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { RegenerateTokenModal } from './RegenerateTokenModal';

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: agent, isLoading: isAgentLoading, error } = useAgent(id!);
  const { data: logData, isLoading: isLogsLoading } = useAgentLogs(id!);
  const { toast } = useToast();
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);

  // Real-time logs via WebSocket
  const { socket } = useSocket('cockpit');

  useEffect(() => {
    if (!socket || !id) return;

    const handleNewLog = (newLog: any) => {
      // Only add log if it belongs to this agent
      if (newLog.agentId === id) {
        queryClient.setQueryData(['agent-logs', id, 1, 50], (oldData: any) => {
          if (!oldData) return { logs: [newLog], pagination: { total: 1, pages: 1, page: 1, limit: 50 } };

          return {
            ...oldData,
            logs: [newLog, ...oldData.logs].slice(0, 50), // Keep latest 50
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
  }, [socket, id, queryClient]);

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

            {agent.lastError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-destructive">Dernière Erreur Enregistrée</p>
                  <pre className="text-sm text-destructive/80 mt-1 whitespace-pre-wrap break-all font-sans">{agent.lastError}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Synchronisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Lignes synchronisées</p>
              <p className="text-2xl font-black">{agent.rowsSynced?.toLocaleString() || 0}</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-destructive" /> Erreurs cumulées
                </span>
                <span className={`font-bold ${(agent.errorCount || 0) > 0 ? 'text-destructive' : 'text-green-500'}`}>
                  {agent.errorCount || 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Statut actuel
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(agent.status)}`}>
                  {getStatusLabel(agent.status)}
                </span>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Dernier heartbeat : {agent.lastSeen ? format(new Date(agent.lastSeen), 'dd/MM/yyyy HH:mm:ss') : 'Jamais'}
                </p>
              </div>
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
                Journal d'activité (Logs)
              </CardTitle>
              <CardDescription>
                Les 50 derniers événements remontés par l'agent
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {(logData?.logs?.filter(l => l.level === 'error').length ?? 0) > 0 && (
                <button
                  onClick={() => setShowErrorsOnly(v => !v)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border transition-colors ${
                    showErrorsOnly
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
            </div>
          </CardContent>
        </Card>
      </div>

      <RegenerateTokenModal
        open={isRegenerateOpen}
        onOpenChange={setIsRegenerateOpen}
        agent={agent}
      />
    </div>
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
