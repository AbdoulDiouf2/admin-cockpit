import api from './client';
import type {
  User,
  Organization,
  Role,
  Permission,
  Agent,
  AuditLog,
  LoginCredentials,
  AuthResponse,
  PaginatedResponse,
  SubscriptionPlan,
  KpiDefinition,
  WidgetTemplate,
  Invitation,
  KpiPack,
  AgentLogsResponse,
  Dashboard,
  BillingSubscriptionsResponse,
  BillingSubscriptionDetailResponse,
} from '@/types';

// Auth
export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post<AuthResponse>('/auth/login', credentials),

  logout: () =>
    api.post('/auth/logout'),

  refresh: () =>
    api.post('/auth/refresh'),

  me: () =>
    api.get<User>('/users/me'),

  updateMe: (data: { firstName?: string; lastName?: string }) =>
    api.patch<User>('/users/me', data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: any) =>
    api.post('/auth/reset-password', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),

};

// Admin - Organizations
export const organizationsApi = {
  getAll: () =>
    api.get<Organization[]>('/admin/organizations'),

  getById: (id: string) =>
    api.get<Organization>(`/admin/organizations/${id}`),

  update: (id: string, data: Partial<Organization>) =>
    api.patch<Organization>(`/admin/organizations/${id}`, data),

  delete: (id: string) =>
    api.delete(`/admin/organizations/${id}`),

  createClient: (data: {
    organizationName: string;
    adminEmail: string;
    adminFirstName: string;
    adminLastName: string;
    planId?: string;
  }) => api.post('/admin/clients', data),
};

// Admin - General
export const adminApi = {
  getStats: () =>
    api.get('/admin/dashboard-stats'),
  getAllInvitations: () =>
    api.get<Invitation[]>('/admin/invitations'),
};

// Admin - Users
export const usersApi = {
  getAll: () =>
    api.get<User[]>('/admin/users'),

  create: (data: any) =>
    api.post<User>('/admin/users', data),

  getById: (id: string) =>
    api.get<User>(`/admin/users/${id}`),

  update: (id: string, data: Partial<User> & { isActive?: boolean }) =>
    api.patch<User>(`/admin/users/${id}`, data),

  delete: (id: string) =>
    api.delete(`/admin/users/${id}`),

  invite: (data: { email: string; role: string; organizationId: string }) =>
    api.post('/auth/invite', data),
};

// Roles
export const rolesApi = {
  getAll: () =>
    api.get<Role[]>('/roles'),

  getById: (id: string) =>
    api.get<Role>(`/roles/${id}`),

  getPermissions: () =>
    api.get<Permission[]>('/roles/permissions'),

  create: (data: { name: string; description?: string; permissionIds: string[] }) =>
    api.post<Role>('/roles', data),

  update: (id: string, data: Partial<Role>) =>
    api.patch<Role>(`/roles/${id}`, data),

  delete: (id: string) =>
    api.delete(`/roles/${id}`),
};

// Agents
export const agentsApi = {
  getStatus: () =>
    api.get('/agents/status'),

  getById: (id: string) =>
    api.get<Agent>(`/agents/${id}`),

  generateToken: (data: { name?: string; force?: boolean }) =>
    api.post('/agents/generate-token', data),

  regenerateToken: (id: string) =>
    api.post(`/agents/${id}/regenerate-token`),

  revokeToken: (id: string) =>
    api.post(`/agents/${id}/revoke`),

  testConnection: (id: string) =>
    api.post(`/agents/${id}/test-connection`),

  getJobStats: (id: string) =>
    api.get<{ PENDING: number; RUNNING: number; COMPLETED: number; FAILED: number; total: number }>(`/agents/${id}/job-stats`),

  getLogs: (id: string, params?: { page?: number; limit?: number; search?: string }) =>
    api.get<AgentLogsResponse>(`/agents/${id}/logs`, { params }),

  getJobs: (id: string, params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get<any>(`/agents/${id}/jobs`, { params }),

  delete: (id: string) =>
    api.delete(`/admin/agents/${id}`),
};

// Subscription Plans
export const subscriptionPlansApi = {
  // Admin endpoint (requires auth + superadmin permissions)
  getAll: () =>
    api.get<SubscriptionPlan[]>('/admin/subscription-plans'),

  // Public endpoint (no auth required)
  getActive: () =>
    api.get<SubscriptionPlan[]>('/subscriptions/plans'),

  create: (data: Partial<SubscriptionPlan>) =>
    api.post<SubscriptionPlan>('/admin/subscription-plans', data),

  update: (id: string, data: Partial<SubscriptionPlan>) =>
    api.patch<SubscriptionPlan>(`/admin/subscription-plans/${id}`, data),

  getById: (id: string) =>
    api.get<SubscriptionPlan>(`/admin/subscription-plans/${id}`),

  deactivate: (id: string) =>
    api.delete(`/admin/subscription-plans/${id}`),
};

// KPI Store - KPI Definitions
export const kpiDefinitionsApi = {
  getAll: () =>
    api.get<KpiDefinition[]>('/admin/kpi-definitions'),

  getById: (id: string) =>
    api.get<KpiDefinition>(`/admin/kpi-definitions/${id}`),

  create: (data: Omit<KpiDefinition, 'id' | 'isActive' | 'createdAt'>) =>
    api.post<KpiDefinition>('/admin/kpi-definitions', data),

  update: (id: string, data: Partial<Omit<KpiDefinition, 'id' | 'createdAt'>>) =>
    api.patch<KpiDefinition>(`/admin/kpi-definitions/${id}`, data),

  toggle: (id: string) =>
    api.delete<KpiDefinition>(`/admin/kpi-definitions/${id}`),
};

// KPI Store - Widget Templates
export const widgetTemplatesApi = {
  getAll: () =>
    api.get<WidgetTemplate[]>('/admin/widget-templates'),

  getById: (id: string) =>
    api.get<WidgetTemplate>(`/admin/widget-templates/${id}`),

  create: (data: Omit<WidgetTemplate, 'id' | 'isActive' | 'createdAt'>) =>
    api.post<WidgetTemplate>('/admin/widget-templates', data),

  update: (id: string, data: Partial<Omit<WidgetTemplate, 'id' | 'createdAt'>>) =>
    api.patch<WidgetTemplate>(`/admin/widget-templates/${id}`, data),

  toggle: (id: string) =>
    api.delete<WidgetTemplate>(`/admin/widget-templates/${id}`),
};

// KPI Store - KPI Packs
export const kpiPacksApi = {
  getAll: () =>
    api.get<KpiPack[]>('/admin/kpi-packs'),

  getById: (id: string) =>
    api.get<KpiPack>(`/admin/kpi-packs/${id}`),

  create: (data: Omit<KpiPack, 'id' | 'isActive' | 'createdAt'>) =>
    api.post<KpiPack>('/admin/kpi-packs', data),

  update: (id: string, data: Partial<Omit<KpiPack, 'id' | 'createdAt'>>) =>
    api.patch<KpiPack>(`/admin/kpi-packs/${id}`, data),

  toggle: (id: string) =>
    api.delete<KpiPack>(`/admin/kpi-packs/${id}`),
};

// Audit Logs
export const auditLogsApi = {
  getAll: (params?: {
    userId?: string;
    event?: string;
    events?: string[];
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => {
    const { events, ...rest } = params ?? {};
    const queryParams: Record<string, unknown> = { ...rest };
    if (events && events.length > 0) queryParams.events = events.join(',');
    return api.get<PaginatedResponse<AuditLog>>('/logs/audit', { params: queryParams });
  },

  getById: (id: string) =>
    api.get<AuditLog>(`/logs/audit/${id}`),

  getEventTypes: () =>
    api.get<{ event: string; count: number }[]>('/logs/audit/events'),
};

// Health
export const healthApi = {
  check: () =>
    api.get('/health'),

  checkDb: () =>
    api.get('/health/db'),
};

// NLQ Store
export const nlqApi = {
  getAllIntents: () =>
    api.get<any[]>('/admin/nlq-intents'),

  getAllTemplates: () =>
    api.get<any[]>('/admin/nlq-templates'),

  getIntentById: (id: string) =>
    api.get<any>(`/admin/nlq-intents/${id}`),

  getTemplateById: (id: string) =>
    api.get<any>(`/admin/nlq-templates/${id}`),

  toggleTemplate: (id: string) =>
    api.patch<any>(`/admin/nlq-templates/${id}/toggle`),

  getAllSessions: () =>
    api.get<any[]>('/admin/nlq-sessions'),

  getSessionById: (id: string) =>
    api.get<any>(`/admin/nlq-sessions/${id}`),
};

// Billing Admin (read-only, SuperAdmin)
export const billingAdminApi = {
  getAllSubscriptions: () =>
    api.get<BillingSubscriptionsResponse>('/admin/billing/subscriptions'),

  getSubscriptionByOrg: (orgId: string) =>
    api.get<BillingSubscriptionDetailResponse>(`/admin/billing/subscriptions/${orgId}`),
};

// System config (global, superadmin only)
export const systemConfigApi = {
  get: () =>
    api.get<{ notificationPreferences: Record<string, unknown> | null }>('/admin/system-config'),

  update: (data: { notificationPreferences: Record<string, unknown> }) =>
    api.patch<{ notificationPreferences: Record<string, unknown> | null }>('/admin/system-config', data),
};

// Dashboards
export const dashboardsApi = {
  getAll: () =>
    api.get<Dashboard[]>('/admin/dashboards'),

  getById: (id: string) =>
    api.get<Dashboard>(`/admin/dashboards/${id}`),

  delete: (id: string) =>
    api.delete(`/admin/dashboards/${id}`),
};
