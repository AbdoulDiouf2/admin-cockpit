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

export function useAgents() {
    return useQuery({
        queryKey: ['agents-status'],
        queryFn: async () => {
            const resp = await agentsApi.getStatus();
            return resp.data as Agent[];
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

export function useAuditLogs() {
    return useQuery({
        queryKey: ['audit-logs'],
        queryFn: async () => {
            const resp = await auditLogsApi.getAll();
            return resp.data;
        },
    });
}
