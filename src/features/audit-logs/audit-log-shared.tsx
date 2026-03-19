/**
 * Shared components and metadata for audit log views (list, drawer, detail page).
 */
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Building2,
  Globe,
  Monitor,
  Clock,
  Hash,
  Tag,
  Bot,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAgent } from '@/hooks/use-api';

// ─── EVENT_META ────────────────────────────────────────────────────────────────
// Complete mapping for all 47 backend event types

export const EVENT_META: Record<string, { label: string; classes: string }> = {
  // Auth
  user_login:                    { label: 'Connexion',                 classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  user_logout:                   { label: 'Déconnexion',               classes: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  user_created:                  { label: 'Utilisateur créé',          classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  user_updated:                  { label: 'Utilisateur modifié',       classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  user_deleted:                  { label: 'Utilisateur supprimé',      classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  user_invited:                  { label: 'Invitation envoyée',        classes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  users_invited_bulk:            { label: 'Invitations en masse',      classes: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  profile_updated:               { label: 'Profil modifié',            classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  token_refreshed:               { label: 'Token rafraîchi',           classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  password_reset_requested:      { label: 'Reset MDP demandé',         classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  password_reset_completed:      { label: 'MDP réinitialisé',          classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },

  // Roles
  role_created:                  { label: 'Rôle créé',                 classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  role_updated:                  { label: 'Rôle modifié',              classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  role_deleted:                  { label: 'Rôle supprimé',             classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },

  // Dashboards & Widgets
  dashboard_created:             { label: 'Dashboard créé',            classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  dashboard_updated:             { label: 'Dashboard modifié',         classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  dashboard_deleted:             { label: 'Dashboard supprimé',        classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  widget_added:                  { label: 'Widget ajouté',             classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  widget_updated:                { label: 'Widget modifié',            classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  widget_removed:                { label: 'Widget supprimé',           classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },

  // Agents
  agent_registered:              { label: 'Agent enregistré',          classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  agent_deleted:                 { label: 'Agent supprimé',            classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  agent_token_generated:         { label: 'Token généré',              classes: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  agent_token_regenerated:       { label: 'Token régénéré',            classes: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  agent_token_revoked:           { label: 'Token révoqué',             classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  agent_token_expired:           { label: 'Token expiré',              classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  agent_heartbeat:               { label: 'Heartbeat agent',           classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  agent_error:                   { label: 'Erreur agent',              classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  agent_connection_tested:       { label: 'Connexion testée',          classes: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  agent_query_executed:          { label: 'Requête agent',             classes: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400' },
  agent_job_timeout:             { label: 'Timeout job',               classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },

  // NLQ
  nlq_executed:                  { label: 'Requête NLQ',               classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  nlq_saved_to_dashboard:        { label: 'NLQ → Dashboard',           classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },

  // Organizations
  organization_created:          { label: 'Organisation créée',        classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  organization_updated:          { label: 'Organisation modifiée',     classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  organization_deleted:          { label: 'Organisation supprimée',    classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },

  // Onboarding
  onboarding_step_completed:     { label: 'Étape onboarding',          classes: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
  onboarding_completed:          { label: 'Onboarding terminé',        classes: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
  datasource_configured:         { label: 'Source configurée',         classes: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },
  agent_linked:                  { label: 'Agent lié',                 classes: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' },

  // Subscription plans (admin)
  subscription_plan_selected:    { label: 'Plan sélectionné',          classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  subscription_plan_created:     { label: 'Plan créé',                 classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  subscription_plan_updated:     { label: 'Plan modifié',              classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  subscription_plan_deactivated: { label: 'Plan désactivé',            classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },

  // KPI & widget store (admin)
  kpi_definition_created:        { label: 'KPI créé',                  classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  kpi_definition_updated:        { label: 'KPI modifié',               classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  kpi_definition_toggled:        { label: 'KPI activé/désactivé',      classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  widget_template_created:       { label: 'Modèle widget créé',        classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  widget_template_updated:       { label: 'Modèle widget modifié',     classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  widget_template_toggled:       { label: 'Modèle widget activé/désact',classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  kpi_pack_created:              { label: 'Pack KPI créé',             classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  kpi_pack_updated:              { label: 'Pack KPI modifié',          classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },
  kpi_pack_toggled:              { label: 'Pack KPI activé/désactivé', classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400' },

  // Targets
  target_created:                { label: 'Objectif créé',             classes: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400' },
  target_updated:                { label: 'Objectif modifié',          classes: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400' },
  target_deleted:                { label: 'Objectif supprimé',         classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },

  // Billing & subscriptions
  billing_checkout_initiated:    { label: 'Paiement initié',           classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  billing_portal_opened:         { label: 'Portail facturation',       classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  subscription_created:          { label: 'Abonnement créé',           classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  subscription_updated:          { label: 'Abonnement modifié',        classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  subscription_cancelled:        { label: 'Abonnement annulé',         classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  payment_succeeded:             { label: 'Paiement réussi',           classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  payment_failed:                { label: 'Paiement échoué',           classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },

  // Audit / access
  audit_logs_viewed:             { label: 'Logs consultés',            classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  admin_users_listed:            { label: 'Users listés (admin)',      classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  admin_organizations_listed:    { label: 'Orgs listées (admin)',      classes: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },

  // Mailer
  email_send_failed:             { label: 'Échec envoi email',         classes: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

// ─── EventBadge ───────────────────────────────────────────────────────────────

export function EventBadge({ event }: { event: string }) {
  const meta = EVENT_META[event];
  const label = meta?.label ?? event.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const classes = meta?.classes ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}

// ─── MetaRow ──────────────────────────────────────────────────────────────────

export function MetaRow({
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

// ─── PayloadViewer ────────────────────────────────────────────────────────────

export function PayloadViewer({
  payload,
  noPayloadLabel,
}: {
  payload: Record<string, unknown> | null | undefined;
  noPayloadLabel: string;
}) {
  if (!payload || Object.keys(payload).length === 0) {
    return <p className="text-sm text-muted-foreground italic">{noPayloadLabel}</p>;
  }
  return (
    <pre className="rounded-md bg-muted p-4 text-xs font-mono overflow-auto max-h-96 whitespace-pre-wrap break-words">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}

// ─── ErrorBlock ───────────────────────────────────────────────────────────────

export function ErrorBlock({
  payload,
  labels,
}: {
  payload: Record<string, unknown>;
  labels: { title: string; httpCode: string; message: string };
}) {
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

// ─── AgentNameRow ─────────────────────────────────────────────────────────────

export function AgentNameRow({ agentId, label }: { agentId: string; label: string }) {
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

// ─── AuditLogDetailContent ────────────────────────────────────────────────────
// Reusable detail content (used both in AuditLogDetailPage and AuditLogDrawer)

import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AuditLog } from '@/types';

export function AuditLogDetailContent({ log }: { log: AuditLog }) {
  const { t, i18n } = useTranslation();
  const d = (key: string) => t(`auditLogs.detail.${key}`);
  const dateLocale = i18n.language === 'fr' ? frLocale : undefined;

  const payload = log.payload as Record<string, unknown> | null | undefined;
  const isError = payload?.status === 'error';
  const duration = payload?.duration_ms as number | undefined;
  const method = payload?.method as string | undefined;
  const path = payload?.path as string | undefined;
  const entityId = payload?.entityId as string | undefined;
  const agentId = (payload?.agentId ?? payload?.agent_id) as string | undefined;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
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
        <p className="text-xs font-mono text-muted-foreground w-full">{log.id}</p>
      </div>

      {/* Error block */}
      {isError && payload && (
        <ErrorBlock
          payload={payload}
          labels={{ title: d('errorDetails'), httpCode: d('httpCode'), message: d('errorMessage') }}
        />
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-4">
        {/* Metadata */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{d('generalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y pt-0">
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
                    <span className="text-muted-foreground font-mono text-xs">({log.user.email})</span>
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
                    <Badge variant="outline" className="mr-2 font-mono text-xs">{method}</Badge>
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

        {/* Payload */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{d('payloadTitle')}</CardTitle>
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
