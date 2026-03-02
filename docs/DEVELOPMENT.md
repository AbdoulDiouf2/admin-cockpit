# Guide de développement - Admin Cockpit

## Architecture des composants

### Providers (src/main.tsx)

L'application utilise plusieurs providers imbriqués :

```tsx
<QueryClientProvider>      // Cache et fetching des données
  <BrowserRouter>          // Routing
    <ThemeProvider>        // Gestion du thème dark/light
      <AuthProvider>       // État d'authentification
        <App />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
</QueryClientProvider>
```

### Flux d'authentification

1. **Au chargement** : `AuthProvider` vérifie le token dans localStorage
2. **Si token présent** : Appel `GET /users/me` pour valider
3. **Si token invalide** : Tentative de refresh, sinon redirection login
4. **Routes protégées** : `ProtectedRoute` wrapper dans `App.tsx`

```tsx
// Utilisation du hook useAuth
const { user, isAuthenticated, login, logout } = useAuth();
```

### Client API (src/api/client.ts)

Configuration Axios avec :
- **Request interceptor** : Ajoute le Bearer token automatiquement
- **Response interceptor** : Gère le refresh token sur 401

```tsx
// Exemple d'utilisation
import { authApi, usersApi } from '@/api';

// Login
const response = await authApi.login({ email, password });

// Fetch users
const users = await usersApi.getAll();
```

### Gestion du thème

```tsx
import { useTheme } from '@/components/shared/ThemeProvider';

const { theme, toggleTheme, setTheme } = useTheme();

// theme: 'dark' | 'light'
// toggleTheme(): void - bascule entre dark/light
// setTheme(theme): void - définit explicitement
```

### Internationalisation

```tsx
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();

// Utilisation
<h1>{t('dashboard.title')}</h1>

// Changer de langue
i18n.changeLanguage('en');
```

Structure des fichiers de traduction :
```
src/i18n/
├── index.ts   # Configuration i18next
├── fr.ts      # Traductions françaises
└── en.ts      # Traductions anglaises
```

## Composants UI

Les composants shadcn/ui sont dans `src/components/ui/`. 

### Composants disponibles

| Composant | Fichier | Usage |
|-----------|---------|-------|
| Button | `button.tsx` | Boutons avec variantes |
| Card | `card.tsx` | Conteneurs avec header/content |
| Input | `input.tsx` | Champs de saisie |
| Label | `label.tsx` | Labels de formulaire |
| Avatar | `avatar.tsx` | Avatars utilisateur |
| Badge | `badge.tsx` | Badges de statut |
| Dialog | `dialog.tsx` | Modales |
| DropdownMenu | `dropdown-menu.tsx` | Menus déroulants |
| Separator | `separator.tsx` | Séparateurs |
| Skeleton | `skeleton.tsx` | Placeholders de chargement |
| Table | `table.tsx` | Tableaux de données |

### Import des composants

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
```

## Ajout d'une nouvelle fonctionnalité

### Exemple : Ajouter une page "Subscriptions"

1. **Créer la page** :
```tsx
// src/features/subscriptions/SubscriptionsPage.tsx
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SubscriptionsPage() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6" data-testid="subscriptions-page">
      <h1 className="text-2xl font-bold">{t('subscriptions.title')}</h1>
      {/* Contenu */}
    </div>
  );
}
```

2. **Ajouter la route** (`src/App.tsx`) :
```tsx
import { SubscriptionsPage } from './features/subscriptions/SubscriptionsPage';

// Dans Routes
<Route path="/subscriptions" element={<SubscriptionsPage />} />
```

3. **Ajouter au Sidebar** (`src/components/layout/Sidebar.tsx`) :
```tsx
import { CreditCard } from 'lucide-react';

const navItems = [
  // ... autres items
  { path: '/subscriptions', icon: CreditCard, labelKey: 'nav.subscriptions' },
];
```

4. **Ajouter les traductions** :
```tsx
// src/i18n/fr.ts
subscriptions: {
  title: 'Abonnements',
  // ...
},

// src/i18n/en.ts  
subscriptions: {
  title: 'Subscriptions',
  // ...
},
```

## Conventions de style

### Classes Tailwind fréquentes

```tsx
// Espacement des pages
<div className="space-y-6">

// En-tête de page
<h1 className="text-2xl font-bold tracking-tight">
<p className="text-muted-foreground">

// Grilles responsives
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

// Flexbox avec actions
<div className="flex items-center justify-between gap-4">
```

### Test IDs

Chaque élément interactif doit avoir un `data-testid` :

```tsx
<Button data-testid="create-user-btn">Créer</Button>
<div data-testid="users-table">...</div>
```

## Variables CSS du thème

Définies dans `src/index.css` :

```css
/* Light mode */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... */
}

/* Dark mode */
.dark {
  --background: 224 71% 4%;
  --foreground: 213 31% 91%;
  --primary: 217.2 91.2% 59.8%;
  /* ... */
}
```

Utilisation dans Tailwind :
```tsx
<div className="bg-background text-foreground">
<button className="bg-primary text-primary-foreground">
```
