import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2, UserPlus, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { usersApi } from '@/api';
import { useAdminUsers } from '@/hooks/use-api';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { InviteUserModal } from './InviteUserModal';
import { EditUserModal } from './EditUserModal';
import { ColumnDef } from '@tanstack/react-table';
import { User } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export function UsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const { data: users, isLoading, error } = useAdminUsers();

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => usersApi.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: t('common.success'),
        description: t('users.deleteSuccess'),
      });
      setDeleteUser(null);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('users.deleteError'),
        variant: 'destructive',
      });
    },
  });

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'firstName',
      header: 'Utilisateur',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.firstName} {row.original.lastName}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: t('common.email'),
    },
    {
      accessorKey: 'organization',
      header: t('users.organization'),
      cell: ({ row }) => row.original.organization?.name || 'N/A',
    },
    {
      accessorKey: 'isActive',
      header: t('common.status'),
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'default' : 'secondary'}>
          {row.original.isActive ? t('users.active') : t('users.inactive')}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: t('common.date'),
      cell: ({ row }) =>
        format(new Date(row.getValue('createdAt')), 'dd/MM/yyyy'),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
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
                <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setEditUser(user)}>
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteUser(user)}
                >
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6" data-testid="users-page">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('users.title')}</h1>
          <p className="text-muted-foreground">{t('users.subtitle')}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} data-testid="invite-user-btn">
          <UserPlus className="h-4 w-4 mr-2" />
          {t('users.invite')}
        </Button>
      </div>

      {/* Users list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('users.listTitle')}
          </CardTitle>
          <CardDescription>{t('users.listSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="h-[400px] flex items-center justify-center text-destructive">
              Erreur lors du chargement des utilisateurs
            </div>
          ) : (
            <DataTable columns={columns} data={users || []} searchKey="firstName" />
          )}
        </CardContent>
      </Card>

      <InviteUserModal open={inviteOpen} onOpenChange={setInviteOpen} />

      <EditUserModal
        open={editUser !== null}
        onOpenChange={(open) => {
          if (!open) setEditUser(null);
        }}
        user={editUser}
      />

      <ConfirmDialog
        open={deleteUser !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteUser(null);
        }}
        title={t('users.confirmDeleteTitle')}
        description={`${t('users.confirmDelete')} "${deleteUser?.firstName} ${deleteUser?.lastName}" ?`}
        onConfirm={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
        isPending={deleteMutation.isPending}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
