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
  PaginatedResponse 
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
};

// Admin - Organizations
export const organizationsApi = {
  getAll: () => 
    api.get<Organization[]>('/admin/organizations'),
  
  getById: (id: string) => 
    api.get<Organization>(`/admin/organizations/${id}`),
  
  update: (id: string, data: Partial<Organization>) => 
    api.patch<Organization>(`/admin/organizations/${id}`, data),
  
  createClient: (data: {
    organizationName: string;
    adminEmail: string;
    adminFirstName: string;
    adminLastName: string;
  }) => api.post('/admin/clients', data),
};

// Admin - Users
export const usersApi = {
  getAll: () => 
    api.get<User[]>('/admin/users'),
  
  getById: (id: string) => 
    api.get<User>(`/users/${id}`),
  
  update: (id: string, data: Partial<User>) => 
    api.patch<User>(`/admin/users/${id}`, data),
  
  delete: (id: string) => 
    api.delete(`/admin/users/${id}`),
};

// Roles
export const rolesApi = {
  getAll: () => 
    api.get<Role[]>('/roles'),
  
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
};

// Audit Logs
export const auditLogsApi = {
  getAll: (params?: {
    userId?: string;
    event?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => api.get<PaginatedResponse<AuditLog>>('/admin/audit-logs', { params }),
  
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