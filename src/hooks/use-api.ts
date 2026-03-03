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

export function useAgentLogs(id: string, page = 1, limit = 50) {
    return useQuery({
        queryKey: ['agent-logs', id, page, limit],
        queryFn: async () => {
            const resp = await agentsApi.getLogs(id, { page, limit });
            return resp.data;
        },
        enabled: !!id,
        refetchInterval: 10 * 1000, // Rafraîchir toutes les 10s pour le "live" feeling
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
