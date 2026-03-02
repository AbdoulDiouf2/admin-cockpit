import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { CreateOrganizationModal } from '../CreateOrganizationModal';

// Mock the API
vi.mock('@/api', () => ({
  organizationsApi: {
    createClient: vi.fn(),
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('CreateOrganizationModal', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal when open=true', () => {
    renderWithProviders(
      <CreateOrganizationModal open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText('Nouvelle Organisation')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    renderWithProviders(
      <CreateOrganizationModal open={false} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.queryByText('Nouvelle Organisation')).not.toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CreateOrganizationModal open={true} onOpenChange={mockOnOpenChange} />
    );

    const submitButton = screen.getByRole('button', {
      name: /créer l'organisation/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Le nom de l'organisation est requis/i)
      ).toBeInTheDocument();
    });
  });

  it('calls organizationsApi.createClient with valid data', async () => {
    const { organizationsApi } = await import('@/api');
    const mockCreateClient = vi.mocked(organizationsApi.createClient);
    mockCreateClient.mockResolvedValue({ data: {} } as any);

    const user = userEvent.setup();

    renderWithProviders(
      <CreateOrganizationModal open={true} onOpenChange={mockOnOpenChange} />
    );

    await user.type(
      screen.getByPlaceholderText('Ex: Ma Grosse Entreprise'),
      'Acme Corp'
    );
    await user.type(screen.getByPlaceholderText('Jean'), 'Alice');
    await user.type(screen.getByPlaceholderText('Dupont'), 'Martin');
    await user.type(
      screen.getByPlaceholderText('jean.dupont@client.com'),
      'alice.martin@acme.com'
    );

    await user.click(
      screen.getByRole('button', { name: /créer l'organisation/i })
    );

    await waitFor(() => {
      expect(mockCreateClient).toHaveBeenCalledWith({
        organizationName: 'Acme Corp',
        adminFirstName: 'Alice',
        adminLastName: 'Martin',
        adminEmail: 'alice.martin@acme.com',
      });
    });
  });

  it('calls onOpenChange when cancel button is clicked', async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <CreateOrganizationModal open={true} onOpenChange={mockOnOpenChange} />
    );

    await user.click(screen.getByRole('button', { name: /annuler/i }));
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
