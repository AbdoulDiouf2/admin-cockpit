import { useQuery } from '@tanstack/react-query';
import {
    organizationsApi,
    usersApi,
    rolesApi,
    agentsApi,
    auditLogsApi,
    adminApi
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

export function useAdminUsers() {
    return useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const resp = await usersApi.getAll();
            return resp.data;
        },
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
