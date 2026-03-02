# InsightSage Admin Cockpit

Interface d'administration pour la plateforme InsightSage.

## 🚀 Démarrage rapide

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

## 🔐 Authentification

Utilisez les identifiants superadmin :

- **Email:** `admin@insightsage.com`
- **Mot de passe:** `admin123!`

## 📁 Structure du projet

```
admin-cockpit/
├── public/                 # Assets statiques
├── src/
│   ├── api/               # Client API et endpoints
│   │   ├── client.ts      # Configuration Axios + intercepteurs
│   │   └── index.ts       # Fonctions API (auth, users, orgs...)
│   │
│   ├── components/
│   │   ├── layout/        # Layout principal
│   │   │   ├── MainLayout.tsx   # Container principal
│   │   │   ├── Sidebar.tsx      # Navigation latérale
│   │   │   └── Header.tsx       # En-tête avec actions
│   │   │
│   │   ├── shared/        # Composants partagés
│   │   │   ├── ThemeProvider.tsx    # Gestion thème dark/light
│   │   │   └── LoadingSpinner.tsx   # Indicateur de chargement
│   │   │
│   │   └── ui/            # Composants UI (shadcn/ui)
│   │
│   ├── features/          # Modules fonctionnels
│   │   ├── auth/          # Authentification
│   │   │   ├── AuthContext.tsx  # Context + hooks auth
│   │   │   └── LoginPage.tsx    # Page de connexion
│   │   │
│   │   ├── dashboard/     # Tableau de bord
│   │   ├── organizations/ # Gestion des organisations
│   │   ├── users/         # Gestion des utilisateurs
│   │   ├── roles/         # Gestion des rôles
│   │   ├── agents/        # Monitoring des agents
│   │   └── audit-logs/    # Logs d'audit
│   │
│   ├── hooks/             # Custom hooks React
│   ├── i18n/              # Internationalisation (FR/EN)
│   ├── lib/               # Utilitaires
│   ├── types/             # Types TypeScript
│   │
│   ├── App.tsx            # Routing principal
│   ├── main.tsx           # Point d'entrée
│   └── index.css          # Styles globaux + thèmes
│
├── .env.example           # Template variables d'environnement
├── package.json
├── tailwind.config.js     # Configuration Tailwind
├── tsconfig.json          # Configuration TypeScript
└── vite.config.ts         # Configuration Vite
```

## 🎨 Fonctionnalités

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

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/login` | Page de connexion |
| `/dashboard` | Tableau de bord avec statistiques |
| `/organizations` | Gestion des organisations clientes |
| `/users` | Gestion des utilisateurs |
| `/roles` | Gestion des rôles et permissions |
| `/agents` | Monitoring des agents Sage on-premise |
| `/audit-logs` | Historique des actions |

## 🔧 Stack technique

- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Typage statique
- **TailwindCSS** - Styling
- **shadcn/ui** - Composants UI
- **React Router v7** - Routing
- **TanStack Query** - Data fetching & cache
- **i18next** - Internationalisation
- **Axios** - Client HTTP
- **Zod** - Validation de schémas
- **React Hook Form** - Gestion des formulaires
- **Recharts** - Graphiques

## 🔌 API Endpoints utilisés

### Authentification
```
POST /api/auth/login        # Connexion
POST /api/auth/logout       # Déconnexion
POST /api/auth/refresh      # Refresh token
GET  /api/users/me          # Profil utilisateur courant
```

### Administration
```
GET  /api/admin/organizations     # Liste des organisations
POST /api/admin/clients           # Créer un client
GET  /api/admin/users             # Liste des utilisateurs
GET  /api/admin/audit-logs        # Logs d'audit
```

### Rôles & Permissions
```
GET    /api/roles              # Liste des rôles
GET    /api/roles/permissions  # Liste des permissions
POST   /api/roles              # Créer un rôle
PATCH  /api/roles/:id          # Modifier un rôle
DELETE /api/roles/:id          # Supprimer un rôle
```

### Agents
```
GET  /api/agents/status              # Statut des agents
POST /api/agents/generate-token      # Générer un token
POST /api/agents/:id/regenerate-token # Regénérer un token
```

## 🛠️ Développement

### Ajouter une nouvelle page

1. Créer le dossier dans `src/features/`
2. Créer le composant page (ex: `MyFeaturePage.tsx`)
3. Ajouter la route dans `src/App.tsx`
4. Ajouter l'entrée de navigation dans `src/components/layout/Sidebar.tsx`
5. Ajouter les traductions dans `src/i18n/fr.ts` et `src/i18n/en.ts`

### Ajouter un endpoint API

1. Définir les types dans `src/types/index.ts`
2. Ajouter la fonction dans `src/api/index.ts`

### Conventions de code

- Composants : PascalCase (`MyComponent.tsx`)
- Hooks : camelCase avec préfixe `use` (`useMyHook.ts`)
- Types : PascalCase (`MyInterface`)
- Fichiers de test : `*.test.tsx` ou `*.spec.tsx`

## 📝 TODO

- [ ] Implémenter les graphiques du dashboard
- [ ] Table des organisations avec filtres
- [ ] Table des utilisateurs avec CRUD
- [ ] Formulaire de création de rôles
- [ ] Monitoring temps réel des agents
- [ ] Export des logs d'audit
- [ ] Tests unitaires et E2E

## 📄 License

Propriétaire - InsightSage © 2024
