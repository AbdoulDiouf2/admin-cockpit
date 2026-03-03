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

// Subscription Plan types
export interface SubscriptionPlan {
  id: string;
  name: string;                  // 'startup' | 'pme' | 'business' | 'enterprise'
  label: string;                 // 'Startup' | 'PME' | ...
  description?: string;
  priceMonthly?: number | null;  // null = sur devis
  maxUsers?: number | null;      // null = illimité
  maxKpis?: number | null;
  maxWidgets?: number | null;
  maxAgentSyncPerDay?: number | null;
  allowedKpiPacks?: string[];
  hasNlq?: boolean;
  hasAdvancedReports?: boolean;
  stripeProductId?: string;
  stripePriceId?: string;
  sortOrder?: number;
  isActive?: boolean;
  _count?: { organizations: number };
  createdAt?: string;
  updatedAt?: string;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  sector?: string;
  size: string;
  planId?: string;
  subscriptionPlan?: SubscriptionPlan;
  country?: string;
  sageMode?: string;
  sageType?: string;
  sageHost?: string;
  sagePort?: number;
  ownerId?: string;
  owner?: User;
  _count?: {
    users: number;
    dashboards: number;
    invitations: number;
  };
  invitations?: Invitation[];
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleId: string;
  role: { name: string };
  expiresAt: string;
  isAccepted: boolean;
  createdAt: string;
  organizationId: string;
  organization?: { id: string; name: string };
  invitedBy?: { id: string; email: string; firstName?: string; lastName?: string };
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
  tokenExpiresAt?: string | null;
  isRevoked?: boolean;
  daysUntilExpiry?: number | null;
  isExpiringSoon?: boolean;
  isSocketConnected?: boolean;
  createdAt: string;
}

export interface AgentLog {
  id: string;
  level: string; // 'info' | 'warning' | 'error' | 'debug'
  message: string;
  timestamp: string;
  organizationId: string;
  agentId: string;
}

export interface AgentLogsResponse {
  logs: AgentLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
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

// KPI Store types
export interface KpiDefinition {
  id: string;
  key: string;
  name: string;
  description?: string;
  unit?: string;
  category: string;
  defaultVizType: string;
  isActive: boolean;
  createdAt: string;
}

export interface WidgetTemplate {
  id: string;
  name: string;
  vizType: string;
  description?: string;
  defaultConfig: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

export interface KpiPack {
  id: string;
  name: string;
  label: string;
  profile: string;
  kpiKeys: string[];
  description?: string;
  isActive: boolean;
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
