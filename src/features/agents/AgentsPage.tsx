import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Cpu, Key, Loader2, Circle, MoreHorizontal, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useAgents } from '@/hooks/use-api';
import { Agent } from '@/types';
import { GenerateTokenModal } from './GenerateTokenModal';
import { RegenerateTokenModal } from './RegenerateTokenModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

export function AgentsPage() {
  const { t } = useTranslation();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [regenerateAgent, setRegenerateAgent] = useState<Agent | null>(null);

  const { data: agents, isLoading, error, isFetching } = useAgents();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500 fill-green-500';
      case 'offline': return 'text-gray-400 fill-gray-400';
      case 'error': return 'text-destructive fill-destructive';
      default: return 'text-yellow-500 fill-yellow-500';
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Données synchronisées</TableHead>
                    <TableHead>Dernière synchro</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents?.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Circle className={`h-2 w-2 ${getStatusColor(agent.status)}`} />
                          <span className="text-sm">{getStatusLabel(agent.status)}</span>
                        </div>
                        {agent.status === 'error' && agent.lastError && (
                          <p className="text-xs text-destructive mt-1 max-w-[200px] truncate">
                            {agent.lastError}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{agent.version || '—'}</TableCell>
                      <TableCell>
                        {agent.rowsSynced?.toLocaleString() || 0} lignes
                        {agent.errorCount > 0 && (
                          <span className="ml-2 text-xs text-destructive">
                            ({agent.errorCount} erreur{agent.errorCount > 1 ? 's' : ''})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {agent.lastSync
                          ? format(new Date(agent.lastSync), 'dd/MM/yyyy HH:mm')
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
                            <DropdownMenuItem onClick={() => setRegenerateAgent(agent)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              {t('agents.regenerateToken')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {agents?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {t('common.noData')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
    </div>
  );
}
