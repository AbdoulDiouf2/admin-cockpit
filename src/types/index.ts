// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  emailVerified: boolean;
  organizationId: string | null;
  organization?: Organization;
  userRoles?: UserRole[];
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role: Role;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  sector?: string;
  size: string;
  plan?: string;
  sageType?: string;
  sageHost?: string;
  sagePort?: number;
  ownerId?: string;
  owner?: User;
  _count?: {
    users: number;
    dashboards: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Role & Permission types
export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  organizationId?: string;
  permissions?: RolePermission[];
  createdAt: string;
}

export interface Permission {
  id: string;
  action: string;
  resource: string;
  description?: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
}

// Agent types
export interface Agent {
  id: string;
  token: string;
  name: string;
  status: 'pending' | 'online' | 'offline' | 'error';
  version?: string;
  lastSeen?: string;
  lastSync?: string;
  rowsSynced: number;
  errorCount: number;
  lastError?: string;
  organizationId: string;
  organization?: Organization;
  createdAt: string;
}

// Audit Log types
export interface AuditLog {
  id: string;
  event: string;
  userId?: string;
  user?: User;
  organizationId: string;
  organization?: Organization;
  payload?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
