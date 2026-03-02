import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { RoleFormModal } from '../RoleFormModal';

vi.mock('@/api', () => ({
  rolesApi: {
    create: vi.fn(),
    update: vi.fn(),
    getPermissions: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const mockPermissions = [
  { id: 'perm-1', action: 'read:users', resource: 'users', description: 'Lire les utilisateurs' },
  { id: 'perm-2', action: 'manage:users', resource: 'users', description: 'Gérer les utilisateurs' },
  { id: 'perm-3', action: 'read:roles', resource: 'roles', description: 'Lire les rôles' },
];

const mockRole = {
  id: 'role-1',
  name: 'Analyste',
  description: 'Rôle analyste',
  isSystem: false,
  permissions: [
    { id: 'rp-1', roleId: 'role-1', permissionId: 'perm-1', permission: mockPermissions[0] },
  ],
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('RoleFormModal', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(async () => {
    // Set up the mock AFTER clearing (setup.ts clears in afterEach)
    const { rolesApi } = await import('@/api');
    vi.mocked(rolesApi.getPermissions).mockResolvedValue({
      data: mockPermissions,
    } as any);
  });

  it('renders create mode when role prop is null', () => {
    renderWithProviders(
      <RoleFormModal open={true} onOpenChange={mockOnOpenChange} role={null} />
    );
    expect(screen.getByRole('heading', { name: 'Créer un rôle' })).toBeInTheDocument();
  });

  it('renders edit mode when role prop is provided', () => {
    renderWithProviders(
      <RoleFormModal open={true} onOpenChange={mockOnOpenChange} role={mockRole} />
    );
    expect(screen.getByRole('heading', { name: 'Modifier le rôle' })).toBeInTheDocument();
  });

  it('pre-populates form in edit mode', async () => {
    renderWithProviders(
      <RoleFormModal open={true} onOpenChange={mockOnOpenChange} role={mockRole} />
    );

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('Ex: Analyste financier') as HTMLInputElement;
      expect(nameInput.value).toBe('Analyste');
    });
  });

  it('renders grouped permissions checkboxes after loading', async () => {
    renderWithProviders(
      <RoleFormModal open={true} onOpenChange={mockOnOpenChange} role={null} />
    );

    await waitFor(() => {
      expect(screen.getByText('users')).toBeInTheDocument();
      expect(screen.getByText('roles')).toBeInTheDocument();
      expect(screen.getByText('read:users')).toBeInTheDocument();
    });
  });

  it('shows validation error when no permissions selected', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <RoleFormModal open={true} onOpenChange={mockOnOpenChange} role={null} />
    );

    await user.type(
      screen.getByPlaceholderText('Ex: Analyste financier'),
      'Mon Rôle'
    );

    // Submit without selecting permissions
    await user.click(screen.getByRole('button', { name: /créer un rôle/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Au moins une permission est requise/i)
      ).toBeInTheDocument();
    });
  });

  it('calls rolesApi.create in create mode with valid data', async () => {
    const { rolesApi } = await import('@/api');
    vi.mocked(rolesApi.create).mockResolvedValue({ data: {} } as any);
    const user = userEvent.setup();

    renderWithProviders(
      <RoleFormModal open={true} onOpenChange={mockOnOpenChange} role={null} />
    );

    await user.type(
      screen.getByPlaceholderText('Ex: Analyste financier'),
      'Auditeur'
    );

    await waitFor(() => {
      expect(screen.getByText('read:users')).toBeInTheDocument();
    });

    // Select a permission
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    await user.click(screen.getByRole('button', { name: /créer un rôle/i }));

    await waitFor(() => {
      expect(rolesApi.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Auditeur' })
      );
    });
  });
});
