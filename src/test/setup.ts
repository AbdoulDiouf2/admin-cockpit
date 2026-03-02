import '@testing-library/jest-dom';

// Polyfills for jsdom (required by Radix UI components)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.DOMRect = class DOMRect {
  bottom = 0;
  height = 0;
  left = 0;
  right = 0;
  top = 0;
  width = 0;
  x = 0;
  y = 0;
  static fromRect() { return new DOMRect(); }
  toJSON() { return {}; }
};

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Minimal i18n setup for tests - returns the key as-is
i18n.use(initReactI18next).init({
  lng: 'fr',
  fallbackLng: 'fr',
  resources: {
    fr: {
      translation: {
        common: {
          success: 'Succès',
          error: 'Erreur',
          save: 'Enregistrer',
          cancel: 'Annuler',
          delete: 'Supprimer',
          edit: 'Modifier',
          actions: 'Actions',
          noData: 'Aucune donnée',
          email: 'Email',
          status: 'Statut',
          date: 'Date',
        },
        users: {
          title: 'Utilisateurs',
          subtitle: 'Gérer tous les utilisateurs',
          listTitle: 'Liste des utilisateurs',
          listSubtitle: 'Tous les utilisateurs de la plateforme',
          firstName: 'Prénom',
          lastName: 'Nom',
          organization: 'Organisation',
          active: 'Actif',
          inactive: 'Inactif',
          invite: 'Inviter un utilisateur',
          inviteSuccess: 'Invitation envoyée',
          inviteError: 'Erreur',
          editSuccess: 'Utilisateur mis à jour',
          editError: 'Erreur',
          deleteSuccess: 'Utilisateur supprimé',
          deleteError: 'Erreur',
          confirmDeleteTitle: "Supprimer l'utilisateur",
          confirmDelete: 'Êtes-vous sûr?',
          editUser: "Modifier l'utilisateur",
          isActive: 'Compte actif',
          inviteRole: 'Rôle',
          inviteOrg: 'Organisation',
        },
        roles: {
          title: 'Rôles & Permissions',
          subtitle: 'Gérer les rôles',
          listTitle: 'Gestion des rôles',
          listSubtitle: 'Rôles et permissions',
          createRole: 'Créer un rôle',
          editRole: 'Modifier le rôle',
          roleName: 'Nom du rôle',
          description: 'Description',
          permissions: 'Permissions',
          selectPermissions: 'Sélectionner les permissions',
          systemRoles: 'Rôles système',
          createSuccess: 'Rôle créé',
          editSuccess: 'Rôle mis à jour',
          deleteSuccess: 'Rôle supprimé',
          createError: 'Erreur',
          editError: 'Erreur',
          deleteError: 'Erreur',
          confirmDeleteTitle: 'Supprimer',
          confirmDeleteDesc: 'Êtes-vous sûr?',
          noDescription: 'Aucune description',
        },
        organizations: {
          title: 'Organisations',
          subtitle: 'Gérer les organisations',
          createClient: 'Créer un client',
          editSuccess: 'Organisation mise à jour',
          editError: 'Erreur',
        },
      },
    },
  },
  interpolation: { escapeValue: false },
  ns: ['translation'],
  defaultNS: 'translation',
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
