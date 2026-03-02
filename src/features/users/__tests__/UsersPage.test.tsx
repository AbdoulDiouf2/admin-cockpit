import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { UsersPage } from '../UsersPage';

// Mock the API
vi.mock('@/api', () => ({
  usersApi: {
    getAll: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    invite: vi.fn(),
  },
  organizationsApi: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
  },
  rolesApi: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const mockUsers = [
  {
    id: 'user-1',
    firstName: 'Alice',
    lastName: 'Martin',
    email: 'alice@acme.com',
    isActive: true,
    emailVerified: true,
    organizationId: 'org-1',
    organization: { id: 'org-1', name: 'Acme Corp' },
    userRoles: [],
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'user-2',
    firstName: 'Bob',
    lastName: 'Dupont',
    email: 'bob@acme.com',
    isActive: false,
    emailVerified: false,
    organizationId: 'org-1',
    organization: { id: 'org-1', name: 'Acme Corp' },
    userRoles: [],
    createdAt: '2024-02-10T10:00:00.000Z',
    updatedAt: '2024-02-10T10:00:00.000Z',
  },
];

describe('UsersPage', () => {
  beforeEach(async () => {
    const { usersApi } = await import('@/api');
    vi.mocked(usersApi.getAll).mockResolvedValue({ data: mockUsers } as any);
  });

  it('renders loading spinner initially', () => {
    renderWithProviders(<UsersPage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders users table with data after loading', async () => {
    renderWithProviders(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Martin')).toBeInTheDocument();
      expect(screen.getByText('Bob Dupont')).toBeInTheDocument();
    });
  });

  it('shows correct status badges', async () => {
    renderWithProviders(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Actif')).toBeInTheDocument();
      expect(screen.getByText('Inactif')).toBeInTheDocument();
    });
  });

  it('opens InviteUserModal when invite button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('invite-user-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('invite-user-btn'));

    await waitFor(() => {
      // Check for a text unique to the dialog (not the button)
      expect(screen.getByText(/email d'invitation sera envoyé/i)).toBeInTheDocument();
    });
  });
});
