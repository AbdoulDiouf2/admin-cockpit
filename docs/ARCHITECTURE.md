# Architecture - Admin Cockpit

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                      Admin Cockpit                          │
│                   (React + Vite + TS)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Login     │  │  Dashboard  │  │   Feature Pages     │ │
│  │   Page      │  │    Page     │  │ (Orgs, Users, etc.) │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│         └────────────────┼─────────────────────┘            │
│                          │                                  │
│                  ┌───────▼───────┐                          │
│                  │  AuthContext  │                          │
│                  │  (JWT Auth)   │                          │
│                  └───────┬───────┘                          │
│                          │                                  │
│                  ┌───────▼───────┐                          │
│                  │  API Client   │                          │
│                  │  (Axios)      │                          │
│                  └───────┬───────┘                          │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           │ HTTP/HTTPS
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Backend NestJS                           │
│                   (Port 3000/api)                           │
├─────────────────────────────────────────────────────────────┤
│  /api/auth/*     │  /api/admin/*   │  /api/roles/*         │
│  /api/users/*    │  /api/agents/*  │  /api/logs/*          │
└─────────────────────────────────────────────────────────────┘
```

## Flux d'authentification

```
┌──────────┐     ┌───────────┐     ┌──────────┐     ┌─────────┐
│  User    │     │  Login    │     │  Auth    │     │ Backend │
│          │     │  Page     │     │ Context  │     │  API    │
└────┬─────┘     └─────┬─────┘     └────┬─────┘     └────┬────┘
     │                 │                │                │
     │ Enter creds     │                │                │
     │────────────────>│                │                │
     │                 │                │                │
     │                 │ login()        │                │
     │                 │───────────────>│                │
     │                 │                │                │
     │                 │                │ POST /auth/login
     │                 │                │───────────────>│
     │                 │                │                │
     │                 │                │  {accessToken, │
     │                 │                │   refreshToken,│
     │                 │                │   user}        │
     │                 │                │<───────────────│
     │                 │                │                │
     │                 │                │ Store tokens   │
     │                 │                │ in localStorage│
     │                 │                │                │
     │                 │                │ Update state   │
     │                 │<───────────────│                │
     │                 │                │                │
     │ Redirect to     │                │                │
     │ /dashboard      │                │                │
     │<────────────────│                │                │
     │                 │                │                │
```

## Gestion des tokens

```
┌─────────────────────────────────────────────────────────────┐
│                     API Client                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Request Interceptor:                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. Get accessToken from localStorage                │   │
│  │ 2. Add Authorization: Bearer {token} header         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Response Interceptor:                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ If 401 Unauthorized:                                │   │
│  │   1. Try POST /auth/refresh with refreshToken       │   │
│  │   2. If success: update tokens, retry request       │   │
│  │   3. If fail: clear tokens, redirect to /login      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Structure des composants

```
App.tsx
├── LoginPage (public)
│
└── ProtectedRoute
    └── MainLayout
        ├── Sidebar
        │   ├── Logo
        │   ├── NavItems[]
        │   └── CollapseButton
        │
        ├── Header
        │   ├── MobileMenuButton
        │   ├── LanguageToggle
        │   ├── ThemeToggle
        │   └── UserMenu
        │
        └── <Outlet> (children routes)
            ├── DashboardPage
            ├── OrganizationsPage
            ├── UsersPage
            ├── RolesPage
            ├── AgentsPage
            └── AuditLogsPage
```

## État global

```
┌─────────────────────────────────────────────────────────────┐
│                    Providers Stack                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  QueryClientProvider (TanStack Query)                       │
│  └── Cache des données API                                  │
│      └── Invalidation automatique                           │
│          └── Retry logic                                    │
│                                                             │
│  BrowserRouter (React Router)                               │
│  └── Gestion des routes                                     │
│      └── History API                                        │
│                                                             │
│  ThemeProvider (Custom)                                     │
│  └── theme: 'dark' | 'light'                               │
│      └── Persistance localStorage                           │
│                                                             │
│  AuthProvider (Custom)                                      │
│  └── user: User | null                                      │
│  └── isAuthenticated: boolean                               │
│  └── isLoading: boolean                                     │
│      └── Persistance localStorage (tokens)                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Communication avec le Backend

### Endpoints principaux

| Module | Endpoint | Méthode | Description |
|--------|----------|---------|-------------|
| Auth | `/api/auth/login` | POST | Connexion |
| Auth | `/api/auth/refresh` | POST | Refresh token |
| Auth | `/api/auth/logout` | POST | Déconnexion |
| Users | `/api/users/me` | GET | Profil courant |
| Admin | `/api/admin/organizations` | GET | Liste orgs |
| Admin | `/api/admin/clients` | POST | Créer client |
| Admin | `/api/admin/users` | GET | Liste users |
| Roles | `/api/roles` | GET/POST | CRUD rôles |
| Agents | `/api/agents/status` | GET | Statut agents |
| Logs | `/api/admin/audit-logs` | GET | Logs audit |

### Format de réponse standard

```typescript
// Succès
{
  data: T,
  // ou pour les listes paginées
  data: T[],
  meta: {
    total: number,
    limit: number,
    offset: number,
    hasMore: boolean
  }
}

// Erreur
{
  statusCode: number,
  message: string,
  error?: string
}
```

## Sécurité

1. **Tokens JWT** stockés en localStorage (non idéal, mais simplifie le développement)
2. **Refresh automatique** des tokens expirés
3. **Routes protégées** via ProtectedRoute wrapper
4. **CORS** configuré côté backend
5. **Validation** des inputs avec Zod
