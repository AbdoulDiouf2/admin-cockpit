import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  Cpu,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOnboardingOverview } from '@/hooks/use-api';
import { useQueryClient } from '@tanstack/react-query';
import type { OnboardingOrgRow } from '@/types';

const STEP_LABELS = ['Plan', 'Organisation', 'Sage', 'Profils', 'Invitations'];

function StepBubbles({ completed, current, isComplete }: { completed: number[]; current: number; isComplete: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {STEP_LABELS.map((_, i) => {
        const step = i + 1;
        const done = completed.includes(step);
        return (
          <div
            key={step}
            title={`Étape ${step} : ${STEP_LABELS[i]}`}
            className={[
              'w-4 h-4 rounded-full border flex items-center justify-center text-[9px] font-bold',
              done
                ? 'bg-green-500 border-green-500 text-white'
                : step === current && !isComplete
                ? 'bg-orange-400 border-orange-400 text-white'
                : 'bg-muted border-muted-foreground/30 text-muted-foreground',
            ].join(' ')}
          >
            {step}
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ row }: { row: OnboardingOrgRow }) {
  if (!row.onboarding) {
    return <Badge variant="outline" className="text-muted-foreground">Non démarré</Badge>;
  }
  if (row.onboarding.isComplete) {
    return <Badge className="bg-green-100 text-green-700 border-green-200">Terminé</Badge>;
  }
  if (row.onboarding.isStuck) {
    return <Badge className="bg-red-100 text-red-700 border-red-200">Bloqué</Badge>;
  }
  return <Badge className="bg-orange-100 text-orange-700 border-orange-200">En cours</Badge>;
}

function AgentBadge({ agent }: { agent: OnboardingOrgRow['agent'] }) {
  if (!agent) return <span className="text-muted-foreground text-xs">—</span>;
  const color =
    agent.status === 'online'
      ? 'text-green-600'
      : agent.status === 'offline'
      ? 'text-gray-400'
      : 'text-red-500';
  return (
    <div className="flex items-center gap-1.5">
      <Circle className={`h-2 w-2 fill-current ${color}`} />
      <span className="text-xs truncate max-w-[90px]" title={agent.name}>
        {agent.name}
      </span>
    </div>
  );
}

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching } = useOnboardingOverview();

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');

  const planOptions = useMemo(() => {
    if (!data) return [];
    const plans = [...new Map(
      data.organizations
        .filter((o) => o.plan)
        .map((o) => [o.plan!.name, o.plan!.label])
    ).entries()];
    return plans.sort((a, b) => a[1].localeCompare(b[1]));
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.organizations.filter((row) => {
      if (filterStatus === 'completed' && !row.onboarding?.isComplete) return false;
      if (filterStatus === 'in_progress' && (row.onboarding?.isComplete || !row.onboarding)) return false;
      if (filterStatus === 'stuck' && !row.onboarding?.isStuck) return false;
      if (filterStatus === 'not_started' && row.onboarding) return false;
      if (filterPlan !== 'all' && row.plan?.name !== filterPlan) return false;
      return true;
    });
  }, [data, filterStatus, filterPlan]);

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Suivi Onboarding</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Progression du wizard d'onboarding pour tous les clients
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['onboarding-overview'] })}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total clients</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">{summary.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" /> Terminés
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold text-green-600">{summary.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-orange-500" /> En cours
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold text-orange-600">{summary.inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-500" /> Bloqués
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold text-red-600">{summary.stuck}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">Non démarrés</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold text-muted-foreground">{summary.notStarted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Cpu className="h-3 w-3 text-blue-500" /> Agents online
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold text-blue-600">{summary.withAgentOnline}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters + Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">Clients ({filtered.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px] h-8 text-sm">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="completed">Terminés</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="stuck">Bloqués</SelectItem>
                  <SelectItem value="not_started">Non démarrés</SelectItem>
                </SelectContent>
              </Select>
              {planOptions.length > 0 && (
                <Select value={filterPlan} onValueChange={setFilterPlan}>
                  <SelectTrigger className="w-[140px] h-8 text-sm">
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les plans</SelectItem>
                    {planOptions.map(([name, label]) => (
                      <SelectItem key={name} value={name}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Chargement...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Aucun résultat
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Étapes (1→5)</TableHead>
                  <TableHead>Étape actuelle</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Utilisateurs</TableHead>
                  <TableHead>Dernière activité</TableHead>
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow
                    key={row.organizationId}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/organizations/${row.organizationId}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{row.organizationName}</p>
                        {row.owner && (
                          <p className="text-xs text-muted-foreground">{row.owner.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.plan ? (
                        <Badge variant="outline" className="text-xs">{row.plan.label}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge row={row} />
                    </TableCell>
                    <TableCell>
                      {row.onboarding ? (
                        <StepBubbles
                          completed={row.onboarding.completedSteps}
                          current={row.onboarding.currentStep}
                          isComplete={row.onboarding.isComplete}
                        />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.onboarding && !row.onboarding.isComplete ? (
                        <span className="text-xs font-medium">
                          Étape {row.onboarding.currentStep} — {STEP_LABELS[row.onboarding.currentStep - 1]}
                        </span>
                      ) : row.onboarding?.isComplete ? (
                        <span className="text-xs text-green-600 font-medium">Complété</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <AgentBadge agent={row.agent} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{row.userCount}</span>
                    </TableCell>
                    <TableCell>
                      {row.onboarding ? (
                        <div>
                          <p className="text-xs">
                            {format(new Date(row.onboarding.updatedAt), 'dd MMM yyyy', { locale: fr })}
                          </p>
                          {row.onboarding.daysSinceUpdate > 0 && (
                            <p className={`text-[11px] ${row.onboarding.isStuck ? 'text-red-500' : 'text-muted-foreground'}`}>
                              il y a {row.onboarding.daysSinceUpdate}j
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Créé le {format(new Date(row.createdAt), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
