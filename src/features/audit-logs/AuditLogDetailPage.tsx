import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  User,
  Building2,
  Globe,
  Monitor,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Hash,
  Tag,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useAuditLog, useAgent } from '@/hooks/use-api';

// ─── Event badge ──────────────────────────────────────────────────────────────

const EVENT_META: Record<string, { label: string; classes: string }> = {
  user_login:               { label: 'Connexion',              classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  user_logout:              { label: 'Déconnexion',            classes: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  user_created:             { label: 'Utilisateur créé',       classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  user_updated:             { label: 'Utilisateur modifié',    classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  user_deleted:             { label: 'Utilisateur supprimé',   classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  user_invited:             { label: 'Invitation envoyée',     classes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  role_created:             { label: 'Rôle créé',              classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  role_updated:             { label: 'Rôle modifié',           classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  role_deleted:             { label: 'Rôle supprimé',          classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  organization_created:     { label: 'Organisation créée',     classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  organization_updated:     { label: 'Organisation modifiée',  classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  organization_deleted:     { label: 'Organisation supprimée', classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  agent_registered:         { label: 'Agent enregistré',       classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  agent_deleted:            { label: 'Agent supprimé',         classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  agent_token_generated:    { label: 'Token généré',           classes: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  agent_token_regenerated:  { label: 'Token régénéré',         classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  agent_token_revoked:      { label: 'Token révoqué',          classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  agent_error:              { label: 'Erreur agent',           classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  agent_heartbeat:          { label: 'Heartbeat agent',        classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  agent_query_executed:     { label: 'Requête agent',          classes: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  agent_job_timeout:        { label: 'Timeout job',            classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  dashboard_created:        { label: 'Dashboard créé',         classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  dashboard_updated:        { label: 'Dashboard modifié',      classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  dashboard_deleted:        { label: 'Dashboard supprimé',     classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  widget_added:             { label: 'Widget ajouté',          classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  widget_updated:           { label: 'Widget modifié',         classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  widget_removed:           { label: 'Widget supprimé',        classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  nlq_executed:             { label: 'Requête NLQ',            classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  nlq_saved_to_dashboard:   { label: 'NLQ → Dashboard',        classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  onboarding_step_completed:{ label: 'Étape onboarding',       classes: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
  onboarding_completed:     { label: 'Onboarding terminé',     classes: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
  datasource_configured:    { label: 'Source configurée',      classes: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
  agent_linked:             { label: 'Agent lié',              classes: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
  password_reset_requested: { label: 'Reset MDP demandé',      classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  password_reset_completed: { label: 'MDP réinitialisé',       classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  token_refreshed:          { label: 'Token rafraîchi',        classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  billing_checkout_initiated:{ label: 'Paiement initié',       classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  subscription_cancelled:   { label: 'Abonnement annulé',      classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  payment_succeeded:        { label: 'Paiement réussi',        classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  payment_failed:           { label: 'Paiement échoué',        classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  audit_logs_viewed:        { label: 'Logs consultés',         classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  admin_users_listed:       { label: 'Users listés (admin)',   classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  admin_organizations_listed:{ label: 'Orgs listées (admin)',  classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

function EventBadge({ event }: { event: string }) {
  const meta = EVENT_META[event];
  const label = meta?.label ?? event.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const classes = meta?.classes ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${classes}`}>
      {label}
    </span>
  );
}

// ─── Metadata row ─────────────────────────────────────────────────────────────

function MetaRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
      <span className="w-36 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm break-all ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</span>
    </div>
  );
}

// ─── Payload JSON viewer ──────────────────────────────────────────────────────

function PayloadViewer({ payload, noPayloadLabel }: { payload: Record<string, unknown> | null | undefined; noPayloadLabel: string }) {
  if (!payload || Object.keys(payload).length === 0) {
    return <p className="text-sm text-muted-foreground italic">{noPayloadLabel}</p>;
  }
  return (
    <pre className="rounded-md bg-muted p-4 text-xs font-mono overflow-auto max-h-96 whitespace-pre-wrap break-words">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}

// ─── Error detail block ───────────────────────────────────────────────────────

function ErrorBlock({ payload, labels }: { payload: Record<string, unknown>; labels: { title: string; httpCode: string; message: string } }) {
  const statusCode = payload.statusCode as number | undefined;
  const errorMessage = payload.errorMessage as string | undefined;

  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-destructive font-semibold">
        <AlertTriangle className="h-4 w-4" />
        {labels.title}
      </div>
      {statusCode && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground w-28 shrink-0">{labels.httpCode}</span>
          <Badge variant="destructive">{statusCode}</Badge>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-start gap-2 text-sm">
          <span className="text-muted-foreground w-28 shrink-0">{labels.message}</span>
          <span className="font-mono text-destructive break-all">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

// ─── Agent name row (fetches lazily only when agentId is present) ─────────────

function AgentNameRow({ agentId, label }: { agentId: string; label: string }) {
  const { data: agent, isLoading } = useAgent(agentId);
  return (
    <MetaRow
      icon={Bot}
      label={label}
      value={
        isLoading ? (
          <span className="text-muted-foreground italic">…</span>
        ) : agent ? (
          <span>
            {agent.name ?? agent.id}{' '}
            <span className="text-muted-foreground font-mono text-xs">({agentId})</span>
          </span>
        ) : (
          <span className="font-mono text-xs">{agentId}</span>
        )
      }
    />
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AuditLogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: log, isLoading, error } = useAuditLog(id!);

  const d = (key: string) => t(`auditLogs.detail.${key}`);
  const dateLocale = i18n.language === 'fr' ? frLocale : undefined;

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (error || !log) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/audit-logs')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {d('backToLogs')}
        </Button>
        <div className="flex h-64 items-center justify-center text-destructive">
          {d('notFound')}
        </div>
      </div>
    );
  }

  const payload = log.payload as Record<string, unknown> | null | undefined;
  const isError = payload?.status === 'error';
  const duration = payload?.duration_ms as number | undefined;
  const method = payload?.method as string | undefined;
  const path = payload?.path as string | undefined;
  const entityId = payload?.entityId as string | undefined;
  const agentId = (payload?.agentId ?? payload?.agent_id) as string | undefined;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/audit-logs')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        {d('backToLogs')}
      </Button>

      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <EventBadge event={log.event} />
            {isError ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> {d('statusError')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> {d('statusSuccess')}
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-muted-foreground">{log.id}</p>
        </div>
      </div>

      {/* Error block (prominent, shown only on errors) */}
      {isError && payload && (
        <ErrorBlock
          payload={payload}
          labels={{ title: d('errorDetails'), httpCode: d('httpCode'), message: d('errorMessage') }}
        />
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left — Metadata */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base">{d('generalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <MetaRow
              icon={Calendar}
              label={d('date')}
              value={format(new Date(log.createdAt), "d MMMM yyyy 'à' HH:mm:ss", { locale: dateLocale })}
            />
            {duration !== undefined && (
              <MetaRow icon={Clock} label={d('duration')} value={`${duration} ms`} mono />
            )}
            <MetaRow
              icon={User}
              label={d('user')}
              value={
                log.user ? (
                  <span>
                    {log.user.firstName} {log.user.lastName}{' '}
                    <span className="text-muted-foreground font-mono text-xs">
                      ({log.user.email})
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">{d('system')}</span>
                )
              }
            />
            <MetaRow
              icon={Building2}
              label={d('organization')}
              value={log.organization?.name ?? log.organizationId ?? '—'}
            />
            {agentId && <AgentNameRow agentId={agentId} label={d('agent')} />}
            <MetaRow icon={Globe} label={d('ipAddress')} value={log.ipAddress} mono />
            {method && path && (
              <MetaRow
                icon={Tag}
                label={d('httpRequest')}
                value={
                  <span>
                    <Badge variant="outline" className="mr-2 font-mono text-xs">
                      {method}
                    </Badge>
                    <span className="font-mono text-xs">{path}</span>
                  </span>
                }
              />
            )}
            {entityId && (
              <MetaRow icon={Hash} label={d('entityId')} value={entityId} mono />
            )}
            {log.userAgent && (
              <MetaRow icon={Monitor} label={d('userAgent')} value={log.userAgent} mono />
            )}
          </CardContent>
        </Card>

        {/* Right — Payload */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-base">{d('payloadTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <PayloadViewer payload={payload} noPayloadLabel={d('noPayload')} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
