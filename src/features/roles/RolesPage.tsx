import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Shield, Plus, Loader2, MoreHorizontal, Lock } from 'lucide-react';
import { useState } from 'react';
import { useRoles } from '@/hooks/use-api';
import { rolesApi } from '@/api';
import { Role } from '@/types';
import { RoleFormModal } from './RoleFormModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export function RolesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // undefined = modal closed, null = create mode, Role = edit mode
  const [formRole, setFormRole] = useState<Role | null | undefined>(undefined);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);

  const { data: roles, isLoading, error } = useRoles();

  const deleteMutation = useMutation({
    mutationFn: (roleId: string) => rolesApi.delete(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: t('common.success'),
        description: t('roles.deleteSuccess'),
      });
      setDeleteRole(null);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('roles.deleteError'),
        variant: 'destructive',
      });
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
        <Button data-testid="create-role-btn" onClick={() => setFormRole(null)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('roles.createRole')}
        </Button>
      </div>

      {/* Roles list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('roles.listTitle')}
          </CardTitle>
          <CardDescription>{t('roles.listSubtitle')}</CardDescription>
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
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles?.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium uppercase">
                        <Link 
                          to={`/roles/${role.id}`}
                          className="text-primary hover:underline"
                        >
                          {role.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {role.description || t('roles.noDescription')}
                      </TableCell>
                      <TableCell>
                        {role.isSystem ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {t('roles.systemRoles').replace('Rôles ', '').replace('System ', '')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            Custom
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {role.isSystem ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Ouvrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setFormRole(role)}>
                                Modifier les permissions
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Ouvrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setFormRole(role)}>
                                {t('common.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteRole(role)}
                              >
                                {t('common.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {roles?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        {t('common.noData')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RoleFormModal
        open={formRole !== undefined}
        onOpenChange={(open) => {
          if (!open) setFormRole(undefined);
        }}
        role={formRole}
      />

      <ConfirmDialog
        open={deleteRole !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteRole(null);
        }}
        title={t('roles.confirmDeleteTitle')}
        description={t('roles.confirmDeleteDesc')}
        onConfirm={() => deleteRole && deleteMutation.mutate(deleteRole.id)}
        isPending={deleteMutation.isPending}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
