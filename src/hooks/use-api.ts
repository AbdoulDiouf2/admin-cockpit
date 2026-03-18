import { useQuery } from '@tanstack/react-query';
import {
    organizationsApi,
    usersApi,
    rolesApi,
    agentsApi,
    auditLogsApi,
    adminApi,
    subscriptionPlansApi,
    kpiDefinitionsApi,
    widgetTemplatesApi,
    kpiPacksApi,
    nlqApi,
    dashboardsApi,
    billingAdminApi,
} from '@/api';
import { Agent } from '@/types';

export function useOrganizations() {
    return useQuery({
        queryKey: ['organizations'],
        queryFn: async () => {
            const resp = await organizationsApi.getAll();
            return resp.data;
        },
    });
}

export function useOrganization(id: string) {
    return useQuery({
        queryKey: ['organizations', id],
        queryFn: async () => {
            const resp = await organizationsApi.getById(id);
            return resp.data;
        },
        enabled: !!id,
    });
}

export function useAdminUsers() {
    return useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const resp = await usersApi.getAll();
            return resp.data;
        },
    });
}

export function useAdminUser(id: string) {
    return useQuery({
        queryKey: ['admin-users', id],
        queryFn: async () => {
            const resp = await usersApi.getById(id);
            return resp.data;
        },
        enabled: !!id,
    });
}

export function useRoles() {
    return useQuery({
        queryKey: ['roles'],
        queryFn: async () => {
            const resp = await rolesApi.getAll();
            return resp.data;
        },
    });
}

export function useRole(id: string) {
    return useQuery({
        queryKey: ['roles', id],
        queryFn: async () => {
            const resp = await rolesApi.getById(id);
            return resp.data;
        },
        enabled: !!id,
    });
}

export function useRolePermissions() {
    return useQuery({
        queryKey: ['role-permissions'],
        queryFn: async () => {
            const resp = await rolesApi.getPermissions();
            return resp.data;
        },
        staleTime: 10 * 60 * 1000,
    });
}

export function useAgents() {
    return useQuery({
        queryKey: ['agents-status'],
        queryFn: async () => {
            const resp = await agentsApi.getStatus();
            return resp.data as Agent[];
        },
        refetchInterval: 30 * 1000,
        refetchIntervalInBackground: false,
    });
}

export function useAgent(id: string) {
    return useQuery({
        queryKey: ['agents', id],
        queryFn: async () => {
            const resp = await agentsApi.getById(id);
            return resp.data;
        },
        enabled: !!id,
    });
}

export function useAgentJobStats(id: string) {
    return useQuery({
        queryKey: ['agent-job-stats', id],
        queryFn: async () => {
            const resp = await agentsApi.getJobStats(id);
            return resp.data;
        },
        enabled: !!id,
        refetchInterval: 30 * 1000,
    });
}

export function useAgentLogs(id: string, page = 1, limit = 50, search?: string) {
    return useQuery({
        queryKey: ['agent-logs', id, page, limit, search],
        queryFn: async () => {
            const resp = await agentsApi.getLogs(id, { page, limit, search });
            return resp.data;
        },
        enabled: !!id,
        refetchInterval: 10 * 1000, // Rafraîchir toutes les 10s pour le "live" feeling
    });
}

export function useAgentJobs(id: string, page = 1, limit = 50, status?: string, search?: string) {
    return useQuery({
        queryKey: ['agent-jobs', id, page, limit, status, search],
        queryFn: async () => {
            const resp = await agentsApi.getJobs(id, { page, limit, status, search });
            return resp.data;
        },
        enabled: !!id,
        refetchInterval: 10 * 1000,
    });
}

export function useAllInvitations() {
    return useQuery({
        queryKey: ['admin-invitations'],
        queryFn: async () => {
            const resp = await adminApi.getAllInvitations();
            return resp.data;
        },
    });
}

export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const resp = await adminApi.getStats();
            return resp.data;
        },
    });
}

export interface AuditLogFilters {
    userId?: string;
    event?: string;
    events?: string[];
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

export function useAuditLogs(filters?: AuditLogFilters) {
    return useQuery({
        queryKey: ['audit-logs', filters],
        queryFn: async () => {
            const resp = await auditLogsApi.getAll(filters);
            return resp.data;
        },
    });
}

export function useAuditLog(id: string) {
    return useQuery({
        queryKey: ['audit-log', id],
        queryFn: async () => {
            const resp = await auditLogsApi.getById(id);
            return resp.data;
        },
        enabled: !!id,
    });
}

export function useAuditLogEventTypes() {
    return useQuery({
        queryKey: ['audit-log-events'],
        queryFn: async () => {
            const resp = await auditLogsApi.getEventTypes();
            return resp.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

// Subscription Plans (admin — tous les plans)
export function useSubscriptionPlans() {
    return useQuery({
        queryKey: ['subscription-plans'],
        queryFn: async () => {
            const resp = await subscriptionPlansApi.getAll();
            return resp.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useSubscriptionPlan(id: string) {
    return useQuery({
        queryKey: ['subscription-plans', id],
        queryFn: async () => {
            const resp = await subscriptionPlansApi.getById(id);
            return resp.data;
        },
        enabled: !!id,
    });
}

// KPI Store hooks
export function useKpiDefinitions() {
    return useQuery({
        queryKey: ['kpi-definitions'],
        queryFn: async () => {
            const resp = await kpiDefinitionsApi.getAll();
            return resp.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useKpiDefinition(id: string) {
    return useQuery({
        queryKey: ['kpi-definitions', id],
        queryFn: async () => {
            const resp = await kpiDefinitionsApi.getById(id);
            return resp.data;
        },
        enabled: !!id,
    });
}

export function useWidgetTemplates() {
    return useQuery({
        queryKey: ['widget-templates'],
        queryFn: async () => {
            const resp = await widgetTemplatesApi.getAll();
            return resp.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useWidgetTemplate(id: string) {
    return useQuery({
        queryKey: ['widget-templates', id],
        queryFn: async () => {
            const resp = await widgetTemplatesApi.getById(id);
            return resp.data;
        },
        enabled: !!id,
    });
}

export function useKpiPacks() {
    return useQuery({
        queryKey: ['kpi-packs'],
        queryFn: async () => {
            const resp = await kpiPacksApi.getAll();
            return resp.data;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useKpiPack(id: string) {
    return useQuery({
        queryKey: ['kpi-packs', id],
        queryFn: async () => {
            const resp = await kpiPacksApi.getById(id);
            return resp.data;
        },
        enabled: !!id,
    });
}

// Plans actifs (public — pour les modals)
export function useActivePlans() {
    return useQuery({
        queryKey: ['subscription-plans', 'active'],
        queryFn: async () => {
            const resp = await subscriptionPlansApi.getActive();
            return resp.data;
        },
        staleTime: 10 * 60 * 1000,
    });
}

export function useNlqIntent(id: string) {
    return useQuery({
        queryKey: ['nlq-intents', id],
        queryFn: async () => {
            const resp = await nlqApi.getIntentById(id);
            return resp.data;
        },
        enabled: !!id,
    });
}

export function useNlqTemplate(id: string) {
    return useQuery({
        queryKey: ['nlq-templates', id],
        queryFn: async () => {
            const resp = await nlqApi.getTemplateById(id);
            return resp.data;
        },
        enabled: !!id,
    });
}

export function useNlqSession(id: string) {
    return useQuery({
        queryKey: ['nlq-sessions', id],
        queryFn: async () => {
            const resp = await nlqApi.getSessionById(id);
            return resp.data;
        },
        enabled: !!id,
    });
}

export function useAdminDashboards() {
    return useQuery({
        queryKey: ['admin-dashboards'],
        queryFn: async () => {
            const resp = await dashboardsApi.getAll();
            return resp.data;
        },
    });
}

export function useAdminDashboard(id: string) {
    return useQuery({
        queryKey: ['admin-dashboards', id],
        queryFn: async () => {
            const resp = await dashboardsApi.getById(id);
            return resp.data;
        },
        enabled: !!id,
    });
}

// Billing Admin hooks
export function useAdminBillingSubscriptions() {
    return useQuery({
        queryKey: ['admin-billing-subscriptions'],
        queryFn: async () => {
            const resp = await billingAdminApi.getAllSubscriptions();
            return resp.data;
        },
    });
}

export function useAdminBillingSubscription(orgId: string) {
    return useQuery({
        queryKey: ['admin-billing-subscriptions', orgId],
        queryFn: async () => {
            const resp = await billingAdminApi.getSubscriptionByOrg(orgId);
            return resp.data;
        },
        enabled: !!orgId,
    });
}
