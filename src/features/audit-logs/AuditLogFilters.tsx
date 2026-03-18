import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Download, X } from 'lucide-react';
import type { AuditLogFilters as Filters } from '@/hooks/use-api';

// Complete labels for all 47 event types
const EVENT_LABELS: Record<string, string> = {
  // Auth
  user_login:                    'Connexion',
  user_logout:                   'Déconnexion',
  user_created:                  'Utilisateur créé',
  user_updated:                  'Utilisateur modifié',
  user_deleted:                  'Utilisateur supprimé',
  user_invited:                  'Invitation envoyée',
  users_invited_bulk:            'Invitations en masse',
  profile_updated:               'Profil modifié',
  token_refreshed:               'Token rafraîchi',
  password_reset_requested:      'Reset MDP demandé',
  password_reset_completed:      'MDP réinitialisé',
  // Roles
  role_created:                  'Rôle créé',
  role_updated:                  'Rôle modifié',
  role_deleted:                  'Rôle supprimé',
  // Dashboards & Widgets
  dashboard_created:             'Dashboard créé',
  dashboard_updated:             'Dashboard modifié',
  dashboard_deleted:             'Dashboard supprimé',
  widget_added:                  'Widget ajouté',
  widget_updated:                'Widget modifié',
  widget_removed:                'Widget supprimé',
  // Agents
  agent_registered:              'Agent enregistré',
  agent_deleted:                 'Agent supprimé',
  agent_token_generated:         'Token généré',
  agent_token_regenerated:       'Token régénéré',
  agent_token_revoked:           'Token révoqué',
  agent_token_expired:           'Token expiré',
  agent_heartbeat:               'Heartbeat agent',
  agent_error:                   'Erreur agent',
  agent_connection_tested:       'Connexion testée',
  agent_query_executed:          'Requête agent',
  agent_job_timeout:             'Timeout job',
  // NLQ
  nlq_executed:                  'Requête NLQ',
  nlq_saved_to_dashboard:        'NLQ → Dashboard',
  // Organizations
  organization_created:          'Organisation créée',
  organization_updated:          'Organisation modifiée',
  organization_deleted:          'Organisation supprimée',
  // Onboarding
  onboarding_step_completed:     'Étape onboarding',
  onboarding_completed:          'Onboarding terminé',
  datasource_configured:         'Source configurée',
  agent_linked:                  'Agent lié',
  // Subscription plans
  subscription_plan_selected:    'Plan sélectionné',
  subscription_plan_created:     'Plan créé',
  subscription_plan_updated:     'Plan modifié',
  subscription_plan_deactivated: 'Plan désactivé',
  // KPI & widget store
  kpi_definition_created:        'KPI créé',
  kpi_definition_updated:        'KPI modifié',
  kpi_definition_toggled:        'KPI activé/désactivé',
  widget_template_created:       'Modèle widget créé',
  widget_template_updated:       'Modèle widget modifié',
  widget_template_toggled:       'Modèle widget activé/désact',
  kpi_pack_created:              'Pack KPI créé',
  kpi_pack_updated:              'Pack KPI modifié',
  kpi_pack_toggled:              'Pack KPI activé/désactivé',
  // Targets
  target_created:                'Objectif créé',
  target_updated:                'Objectif modifié',
  target_deleted:                'Objectif supprimé',
  // Billing
  billing_checkout_initiated:    'Paiement initié',
  billing_portal_opened:         'Portail facturation',
  subscription_created:          'Abonnement créé',
  subscription_updated:          'Abonnement modifié',
  subscription_cancelled:        'Abonnement annulé',
  payment_succeeded:             'Paiement réussi',
  payment_failed:                'Paiement échoué',
  // Audit / access
  audit_logs_viewed:             'Logs consultés',
  admin_users_listed:            'Users listés (admin)',
  admin_organizations_listed:    'Orgs listées (admin)',
};

interface AuditLogFiltersProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
    onExport: () => void;
    eventTypes: { event: string; count: number }[];
    /** When set, only these event types appear in the dropdown */
    categoryEvents?: string[];
}

export function AuditLogFilters({
    filters,
    onFiltersChange,
    onExport,
    eventTypes,
    categoryEvents,
}: AuditLogFiltersProps) {
    const { t } = useTranslation();

    const hasActiveFilters = !!(filters.event || filters.startDate || filters.endDate);

    // Filter the event list to the active category
    const visibleEvents = categoryEvents
        ? eventTypes.filter((et) => categoryEvents.includes(et.event))
        : eventTypes;

    const clearFilters = () => {
        onFiltersChange({ limit: filters.limit, offset: 0, startDate: undefined, endDate: undefined });
    };

    return (
        <div className="flex flex-wrap items-center gap-3 pb-4">
            {/* Event filter */}
            <Select
                value={filters.event || '_all'}
                onValueChange={(value) =>
                    onFiltersChange({
                        ...filters,
                        event: value === '_all' ? undefined : value,
                        offset: 0,
                    })
                }
            >
                <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder={t('auditLogs.allEvents')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="_all">{t('auditLogs.allEvents')}</SelectItem>
                    {visibleEvents.map((et) => (
                        <SelectItem key={et.event} value={et.event}>
                            {EVENT_LABELS[et.event] ?? et.event}
                            <span className="ml-2 text-xs text-muted-foreground">
                                ({et.count})
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Start date */}
            <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Du</span>
                <Input
                    type="date"
                    className="w-[160px] [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-clear-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                    value={filters.startDate || ''}
                    onChange={(e) =>
                        onFiltersChange({
                            ...filters,
                            startDate: e.target.value || undefined,
                            offset: 0,
                        })
                    }
                />
            </div>

            {/* End date */}
            <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Au</span>
                <Input
                    type="date"
                    className="w-[160px] [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-clear-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                    value={filters.endDate || ''}
                    onChange={(e) =>
                        onFiltersChange({
                            ...filters,
                            endDate: e.target.value || undefined,
                            offset: 0,
                        })
                    }
                />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Réinitialiser
                </Button>
            )}

            {/* Export button - pushed to right */}
            <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={onExport}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('auditLogs.exportCsv')}
                </Button>
            </div>
        </div>
    );
}
