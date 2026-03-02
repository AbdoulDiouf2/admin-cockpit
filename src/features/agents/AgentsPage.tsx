import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Cpu, Key, Loader2, Circle } from 'lucide-react';
import { agentsApi } from '@/api';
import { Agent } from '@/types';

export function AgentsPage() {
  const { t } = useTranslation();

  const { data: agents, isLoading, error } = useQuery({
    queryKey: ['agents-status'],
    queryFn: async () => {
      const response = await agentsApi.getStatus();
      return response.data as Agent[];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500 fill-green-500';
      case 'offline': return 'text-gray-400 fill-gray-400';
      case 'error': return 'text-destructive fill-destructive';
      default: return 'text-yellow-500 fill-yellow-500';
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
        <Button data-testid="generate-token-btn">
          <Key className="h-4 w-4 mr-2" />
          {t('agents.generateToken')}
        </Button>
      </div>

      {/* Agents list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            {t('agents.listTitle') || 'Agents on-premise'}
          </CardTitle>
          <CardDescription>
            {t('agents.listSubtitle') || 'Monitoring des agents déployés chez les clients'}
          </CardDescription>
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents?.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Circle className={`h-2 w-2 ${getStatusColor(agent.status)}`} />
                          <span className="capitalize">{agent.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{agent.version || 'v1.0.0'}</TableCell>
                      <TableCell>{agent.rowsSynced?.toLocaleString() || 0} lignes</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Logs
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {agents?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Aucun agent trouvé.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
