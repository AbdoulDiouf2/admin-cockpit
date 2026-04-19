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
  OnboardingOverviewResponse,
  KpiHealthStat,
  KpiHealthDetail,
  AgentRelease,
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
    api.post('/auth/forgot-password', { email, source: 'admin' }),

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

// Roles (routes admin dédiées — cross-org pour superadmin)
export const rolesApi = {
  getAll: () =>
    api.get<Role[]>('/admin/roles'),

  getById: (id: string) =>
    api.get<Role>(`/admin/roles/${id}`),

  getPermissions: () =>
    api.get<Permission[]>('/roles/permissions'), // déjà cross-org, pas de changement

  create: (data: { organizationId: string; name: string; description?: string; permissionIds: string[] }) =>
    api.post<Role>('/admin/roles', data),

  update: (id: string, data: Partial<Role>) =>
    api.patch<Role>(`/admin/roles/${id}`, data),

  delete: (id: string) =>
    api.delete(`/admin/roles/${id}`),
};

// Agents (toutes les routes via /admin/ pour accès cross-org superadmin)
export const agentsApi = {
  getStatus: () =>
    api.get('/admin/agents'),

  getById: (id: string) =>
    api.get<Agent>(`/admin/agents/${id}`),

  generateToken: (data: { organizationId: string; name?: string }) =>
    api.post('/admin/agents/generate-token', data),

  regenerateToken: (id: string) =>
    api.post(`/admin/agents/${id}/regenerate-token`),

  revokeToken: (id: string) =>
    api.post(`/admin/agents/${id}/revoke`),

  testConnection: (id: string) =>
    api.post(`/admin/agents/${id}/test-connection`),

  getJobStats: (id: string) =>
    api.get<{ PENDING: number; RUNNING: number; COMPLETED: number; FAILED: number; total: number }>(`/admin/agents/${id}/job-stats`),

  getLogs: (id: string, params?: { page?: number; limit?: number; search?: string }) =>
    api.get<AgentLogsResponse>(`/admin/agents/${id}/logs`, { params }),

  getJobs: (id: string, params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get<any>(`/admin/agents/${id}/jobs`, { params }),

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

// Audit Logs (routes admin — cross-org pour superadmin)
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
    return api.get<PaginatedResponse<AuditLog>>('/admin/audit-logs', { params: queryParams });
  },

  getById: (id: string) =>
    api.get<AuditLog>(`/admin/audit-logs/${id}`),

  getEventTypes: () =>
    api.get<{ event: string; count: number }[]>('/logs/audit/events'), // conservé (endpoint public cross-org)
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
export type NlqProvider = 'claude' | 'local' | 'none';

export interface AiFeatureFlags {
  nlqProvider?: NlqProvider;
  localLlmUrl?: string;
  localLlmModel?: string;
  claudeInsights?: boolean;
}

export interface SystemConfig {
  notificationPreferences: Record<string, unknown> | null;
  featureFlags: AiFeatureFlags | null;
}

export const systemConfigApi = {
  get: () => api.get<SystemConfig>('/admin/system-config'),

  update: (data: Partial<Pick<SystemConfig, 'notificationPreferences' | 'featureFlags'>>) =>
    api.patch<SystemConfig>('/admin/system-config', data),
};

export const aiApi = {
  getLocalModels: (url: string) =>
    api.get<{ models: string[] }>(`/admin/ai/local-models?url=${encodeURIComponent(url)}`),
};

// Onboarding Overview
export const onboardingApi = {
  getOverview: () =>
    api.get<OnboardingOverviewResponse>('/admin/onboarding'),
};

// KPI Health
export const kpiHealthApi = {
  getStats: () =>
    api.get<KpiHealthStat[]>('/admin/kpi-health'),

  getDetail: (id: string) =>
    api.get<KpiHealthDetail>(`/admin/kpi-health/${id}`),
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

// Agent Releases
export const agentReleasesApi = {
  getAll: () =>
    api.get<AgentRelease[]>('/admin/agent-releases'),

  upload: (formData: FormData) =>
    api.post<AgentRelease>('/admin/agent-releases', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  setLatest: (id: string) =>
    api.patch<AgentRelease>(`/admin/agent-releases/${id}/set-latest`),

  delete: (id: string) =>
    api.delete(`/admin/agent-releases/${id}`),
};
