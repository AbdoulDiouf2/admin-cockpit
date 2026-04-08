# InsightSage Admin Cockpit

Interface d'administration pour la plateforme InsightSage.

## Démarrage rapide

### Prérequis

- Node.js 18+
- Yarn
- Backend NestJS en cours d'exécution

### Installation

```bash
cd admin-cockpit
yarn install
```

### Configuration

Créez un fichier `.env` à partir de l'exemple :

```bash
cp .env.example .env
```

Variables d'environnement :

| Variable | Description | Défaut |
|----------|-------------|--------|
| `VITE_API_URL` | URL de l'API backend | `http://localhost:3000/api` |

### Lancement

```bash
# Mode développement
yarn dev

# Build production
yarn build

# Preview du build
yarn preview
```

L'application sera disponible sur `http://localhost:5173`

## Authentification

Utilisez les identifiants superadmin :

- **Email:** `admin@insightsage.com`
- **Mot de passe:** `admin123!`

## Structure du projet

```
admin-cockpit/
├── public/                 # Assets statiques
├── src/
│   ├── api/               # Client API et endpoints
│   │   ├── client.ts      # Configuration Axios + intercepteurs JWT
│   │   └── index.ts       # Fonctions API (auth, orgs, users, roles, agents,
│   │                      #   subscriptions, kpi-definitions, widget-templates,
│   │                      #   kpi-packs, audit-logs)
│   │
│   ├── components/
│   │   ├── layout/        # Layout principal
│   │   │   ├── MainLayout.tsx        # Container principal
│   │   │   ├── Sidebar.tsx           # Navigation latérale (9 items)
│   │   │   └── Header.tsx            # En-tête (thème, langue, profil)
│   │   │
│   │   ├── shared/        # Composants partagés
│   │   │   ├── DataTable.tsx         # Table générique TanStack
│   │   │   ├── ConfirmDialog.tsx     # Dialog de confirmation
│   │   │   ├── LoadingSpinner.tsx    # Indicateur de chargement
│   │   │   └── ThemeProvider.tsx     # Gestion thème dark/light
│   │   │
│   │   └── ui/            # Composants UI (shadcn/ui)
│   │
│   ├── features/          # Modules fonctionnels
│   │   ├── auth/          # Authentification (login, forgot/reset password)
│   │   ├── dashboard/     # Tableau de bord avec statistiques
│   │   ├── organizations/ # Gestion des organisations + page de détail
│   │   ├── users/         # Gestion des utilisateurs + page de détail
│   │   ├── roles/         # Gestion des rôles RBAC + page de détail
│   │   ├── agents/        # Monitoring des agents Sage on-premise + détail
│   │   ├── audit-logs/    # Logs d'audit avec filtres
│   │   ├── health/        # Health check backend
│   │   ├── profile/       # Profil utilisateur courant
│   │   ├── subscriptions/ # Plans d'abonnement + page de détail
│   │   └── kpi-store/     # KPI Store — KPI Definitions, Widget Templates, KPI Packs
│   │       ├── KpiStorePage.tsx              # Page principale (3 onglets)
│   │       ├── KpiDefinitionsTab.tsx         # Onglet KPI Definitions
│   │       ├── WidgetTemplatesTab.tsx        # Onglet Widget Templates
│   │       ├── KpiPacksTab.tsx               # Onglet KPI Packs
│   │       ├── WidgetTemplateDetailPage.tsx  # Page de détail widget template
│   │       ├── CreateKpiDefinitionModal.tsx
│   │       ├── EditKpiDefinitionModal.tsx
│   │       ├── CreateWidgetTemplateModal.tsx
│   │       ├── EditWidgetTemplateModal.tsx
│   │       ├── CreateKpiPackModal.tsx
│   │       └── EditKpiPackModal.tsx
│   │
│   ├── hooks/             # Custom hooks React (use-api.ts, use-toast.ts, ...)
│   ├── i18n/              # Internationalisation (FR/EN)
│   ├── lib/               # Utilitaires (cn, formatters)
│   ├── types/             # Types TypeScript (User, Org, KpiDefinition, ...)
│   │
│   ├── App.tsx            # Routing principal (routes protégées)
│   ├── main.tsx           # Point d'entrée
│   └── index.css          # Styles globaux + thèmes CSS custom
│
├── .env.example           # Template variables d'environnement
├── package.json
├── tailwind.config.js     # Configuration Tailwind
├── tsconfig.json          # Configuration TypeScript
└── vite.config.ts         # Configuration Vite
```

## Fonctionnalités

### Thème
- **Dark mode** par défaut
- Toggle light/dark dans le header
- Sauvegarde automatique dans localStorage

### Internationalisation
- **Français** par défaut
- Anglais disponible
- Toggle de langue dans le header

### Navigation
- Sidebar responsive (collapse sur desktop, drawer sur mobile)
- Routes protégées (redirection vers login si non authentifié)

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Page de connexion |
| `/forgot-password` | Récupération de mot de passe |
| `/reset-password` | Réinitialisation de mot de passe |
| `/dashboard` | Tableau de bord avec statistiques globales |
| `/organizations` | Gestion des organisations clientes |
| `/organizations/:id` | Détail d'une organisation |
| `/users` | Gestion des utilisateurs admin |
| `/users/:id` | Détail d'un utilisateur |
| `/roles` | Gestion des rôles et permissions RBAC |
| `/roles/:id` | Détail d'un rôle |
| `/subscription-plans` | Plans d'abonnement |
| `/subscription-plans/:id` | Détail d'un plan |
| `/kpi-store` | KPI Store — 3 onglets : KPI Definitions / Widget Templates / KPI Packs |
| `/kpi-store/widget-templates/:id` | Détail d'un Widget Template (config JSON, statut, édition) |
| `/agents` | Monitoring des agents Sage on-premise |
| `/agents/:id` | Détail d'un agent |
| `/audit-logs` | Historique des actions (filtres par utilisateur, événement, date) |
| `/health` | Health check du backend |
| `/profile` | Profil de l'utilisateur courant |
| `/bug-tracker` | Bug Tracker interne (Admin) |
| `/bug-tracker/create` | Formulaire de signalement avancé |

## Stack technique

- **React 18** — UI library
- **Vite** — Build tool
- **TypeScript** — Typage statique
- **TailwindCSS** — Styling
- **shadcn/ui** — Composants UI
- **React Router v7** — Routing
- **TanStack Query** — Data fetching & cache
- **i18next** — Internationalisation (FR/EN)
- **Axios** — Client HTTP avec intercepteurs JWT
- **Zod** — Validation de schémas
- **React Hook Form** — Gestion des formulaires
- **Recharts** — Graphiques

## API Endpoints utilisés

### Authentification
```
POST /api/auth/login           # Connexion
POST /api/auth/logout          # Déconnexion
POST /api/auth/refresh         # Refresh token
POST /api/auth/forgot-password # Mot de passe oublié
POST /api/auth/reset-password  # Réinitialisation
GET  /api/users/me             # Profil utilisateur courant
PATCH /api/users/me            # Mise à jour profil
```

### Administration (superadmin)
```
GET    /api/admin/dashboard-stats         # Statistiques globales
GET    /api/admin/organizations           # Liste des organisations
GET    /api/admin/organizations/:id       # Détail organisation
PATCH  /api/admin/organizations/:id       # Modifier organisation
DELETE /api/admin/organizations/:id       # Supprimer organisation
POST   /api/admin/clients                 # Créer un client (org + admin)
GET    /api/admin/users                   # Liste des utilisateurs
GET    /api/admin/users/:id               # Détail utilisateur
PATCH  /api/admin/users/:id              # Modifier utilisateur
DELETE /api/admin/users/:id              # Supprimer utilisateur
GET    /api/admin/audit-logs             # Logs d'audit (filtres)
GET    /api/admin/audit-logs/event-types # Types d'événements
```

### Plans d'abonnement
```
GET    /api/admin/subscription-plans      # Tous les plans
GET    /api/admin/subscription-plans/:id  # Détail d'un plan
POST   /api/admin/subscription-plans      # Créer un plan
PATCH  /api/admin/subscription-plans/:id  # Modifier un plan
DELETE /api/admin/subscription-plans/:id  # Désactiver un plan
```

### KPI Store (admin)
```
GET    /api/admin/kpi-definitions         # Toutes les KPI Definitions
POST   /api/admin/kpi-definitions         # Créer une KPI Definition
PATCH  /api/admin/kpi-definitions/:id     # Modifier
DELETE /api/admin/kpi-definitions/:id     # Toggle isActive (soft delete)

GET    /api/admin/widget-templates        # Tous les Widget Templates
GET    /api/admin/widget-templates/:id    # Détail d'un Widget Template
POST   /api/admin/widget-templates        # Créer
PATCH  /api/admin/widget-templates/:id    # Modifier
DELETE /api/admin/widget-templates/:id    # Toggle isActive (soft delete)

GET    /api/admin/kpi-packs               # Tous les KPI Packs
POST   /api/admin/kpi-packs              # Créer
PATCH  /api/admin/kpi-packs/:id          # Modifier
DELETE /api/admin/kpi-packs/:id          # Toggle isActive (soft delete)
```

### Rôles & Permissions
```
GET    /api/roles              # Liste des rôles
GET    /api/roles/:id          # Détail d'un rôle
GET    /api/roles/permissions  # Liste des permissions
POST   /api/roles              # Créer un rôle
PATCH  /api/roles/:id          # Modifier un rôle
DELETE /api/roles/:id          # Supprimer un rôle
```

### Agents
```
GET  /api/agents                         # Statut de tous les agents
GET  /api/agents/:id                     # Détail d'un agent
POST /api/agents/generate-token          # Générer un token agent
POST /api/agents/:id/regenerate-token    # Regénérer le token
POST /api/agents/:id/revoke              # Révoquer le token
```

### Bug Tracker (Ticketing)
```
POST /api/v1/bugs                         # Créer un ticket
POST /api/v1/bugs/upload                  # Upload temporaire (temp/)
GET  /api/v1/bugs                         # Liste des bugs (admin)
```

## Développement

### Ajouter une nouvelle page

1. Créer le dossier dans `src/features/<feature>/`
2. Créer le composant page (`MyFeaturePage.tsx`)
3. Définir les types dans `src/types/index.ts`
4. Ajouter les fonctions API dans `src/api/index.ts`
5. Ajouter un hook dans `src/hooks/use-api.ts`
6. Ajouter la route dans `src/App.tsx`
7. Ajouter l'entrée de navigation dans `src/components/layout/Sidebar.tsx`
8. Ajouter les traductions dans `src/i18n/fr.ts` et `src/i18n/en.ts`

### Conventions de code

- Composants : PascalCase (`MyComponent.tsx`)
- Hooks : camelCase avec préfixe `use` (`useMyHook.ts`)
- Types : PascalCase (`MyInterface`)
- API : objet nommé `<entity>Api` dans `src/api/index.ts`
- Fichiers de test : `*.test.tsx` ou `*.spec.tsx`

### Pattern DataTable + chargement

```tsx
{isLoading ? (
  <div className="h-[300px] flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
) : (
  <DataTable columns={columns} data={data ?? []} searchKey="name" />
)}
```

> `DataTable` n'accepte pas de prop `isLoading` — utiliser le pattern conditionnel ci-dessus.

## License

Propriétaire — InsightSage © 2025
