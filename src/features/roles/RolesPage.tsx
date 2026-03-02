import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Shield, Plus, Loader2 } from 'lucide-react';
import { rolesApi } from '@/api';

export function RolesPage() {
  const { t } = useTranslation();

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await rolesApi.getAll();
      return response.data;
    },
  });

  return (
    <div className="space-y-6" data-testid="roles-page">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('roles.title')}</h1>
          <p className="text-muted-foreground">{t('roles.subtitle')}</p>
        </div>
        <Button data-testid="create-role-btn">
          <Plus className="h-4 w-4 mr-2" />
          {t('roles.createRole')}
        </Button>
      </div>

      {/* Roles list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('roles.listTitle') || 'Gestion des rôles'}
          </CardTitle>
          <CardDescription>
            {t('roles.listSubtitle') || 'Définissez les rôles et leurs permissions associées'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="h-[400px] flex items-center justify-center text-destructive">
              Erreur lors du chargement des rôles
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles?.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium uppercase">{role.name}</TableCell>
                      <TableCell>{role.description || 'Aucune description'}</TableCell>
                      <TableCell>
                        {role.isSystem ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                            Système
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                            Custom
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!role.isSystem && (
                          <Button variant="ghost" size="sm">
                            Éditer
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {roles?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Aucun rôle trouvé.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
