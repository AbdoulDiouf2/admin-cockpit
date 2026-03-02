import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Loader2, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { CreateOrganizationModal } from './CreateOrganizationModal';
import { DataTable } from '@/components/shared/DataTable';
import { useOrganizations } from '@/hooks/use-api';
import { ColumnDef } from '@tanstack/react-table';
import { Organization } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export function OrganizationsPage() {
  const { t } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { data: organizations, isLoading, error } = useOrganizations();

  const columns: ColumnDef<Organization>[] = [
    {
      accessorKey: 'name',
      header: 'Nom',
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <div className="text-sm font-mono">{row.getValue('id')}</div>,
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: () => (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Créée le',
      cell: ({ row }) => format(new Date(row.getValue('createdAt')), 'dd/MM/yyyy'),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const org = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Ouvrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(org.id)}>
                  Copier l'ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Éditer</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Désactiver</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6" data-testid="organizations-page">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('organizations.title')}</h1>
          <p className="text-muted-foreground">{t('organizations.subtitle')}</p>
        </div>
        <Button data-testid="create-org-btn" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('organizations.createClient')}
        </Button>
      </div>

      {/* Organizations list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('organizations.listTitle') || 'Liste des organisations'}
          </CardTitle>
          <CardDescription>
            {t('organizations.listSubtitle') || 'Toutes les organisations enregistrées sur la plateforme'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="h-[400px] flex items-center justify-center text-destructive">
              Erreur lors du chargement des organisations
            </div>
          ) : (
            <DataTable columns={columns} data={organizations || []} searchKey="name" />
          )}
        </CardContent>
      </Card>

      <CreateOrganizationModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}
