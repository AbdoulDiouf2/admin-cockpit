import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { usersApi } from '@/api';
import { useAdminUsers, useOrganizations, useRoles } from '@/hooks/use-api';
import { DataTable } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { InviteUserModal } from './InviteUserModal';
import { CreateUserModal } from './CreateUserModal';
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
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data: users, isLoading, error } = useAdminUsers();
  const { data: organizations } = useOrganizations();
  const { data: roles } = useRoles();

  const filteredUsers = (users || []).filter((user) => {
    if (statusFilter === 'active' && !user.isActive) return false;
    if (statusFilter === 'inactive' && user.isActive) return false;
    if (orgFilter && user.organizationId !== orgFilter) return false;
    if (roleFilter && !user.userRoles?.some((ur) => ur.role?.name === roleFilter)) return false;
    return true;
  });

  const hasActiveFilters = statusFilter !== '' || orgFilter !== '' || roleFilter !== '';
  const resetFilters = () => { setStatusFilter(''); setOrgFilter(''); setRoleFilter(''); };

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
      header: t('users.columnUser'),
      cell: ({ row }) => (
        <div className="font-medium">
          <Link
            to={`/users/${row.original.id}`}
            className="text-primary hover:underline"
          >
            {row.original.firstName} {row.original.lastName}
          </Link>
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
      id: 'roles',
      header: t('users.role'),
      cell: ({ row }) => {
        const roles = row.original.userRoles?.map(ur => ur.role?.name).filter(Boolean) || [];
        return (
          <div className="flex flex-wrap gap-1">
            {roles.length > 0 ? (
              roles.map(role => (
                <Badge key={role} variant="outline" className="capitalize">
                  {role}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-xs italic">{t('users.noRole')}</span>
            )}
          </div>
        );
      },
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
                  <span className="sr-only">{t('common.actions')}</span>
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setInviteOpen(true)} data-testid="invite-user-btn">
            <UserPlus className="h-4 w-4 mr-2" />
            {t('users.invite')}
          </Button>
          <Button onClick={() => setCreateOpen(true)} data-testid="create-user-btn">
            <UserPlus className="h-4 w-4 mr-2" />
            {t('users.create')}
          </Button>
        </div>
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
          <DataTable
            columns={columns}
            data={filteredUsers}
            searchKey="firstName"
            searchPlaceholder={t('users.searchPlaceholder')}
            isLoading={isLoading}
            extraFilters={
              <FilterBar
                filters={[
                  {
                    key: 'status',
                    label: t('common.status'),
                    options: [
                      { label: t('users.filterActive'), value: 'active' },
                      { label: t('users.filterInactive'), value: 'inactive' },
                    ],
                    value: statusFilter,
                    onChange: setStatusFilter,
                  },
                  {
                    key: 'org',
                    label: t('users.organization'),
                    options: (organizations || []).map((org) => ({ label: org.name, value: org.id })),
                    value: orgFilter,
                    onChange: setOrgFilter,
                  },
                  {
                    key: 'role',
                    label: t('users.role'),
                    options: (roles || []).map((role) => ({ label: role.name, value: role.name })),
                    value: roleFilter,
                    onChange: setRoleFilter,
                  },
                ]}
                onReset={resetFilters}
                hasActiveFilters={hasActiveFilters}
              />
            }
          />
          {error && (
            <div className="mt-4 p-4 text-center text-destructive bg-destructive/10 rounded-md">
              {t('common.error')}
            </div>
          )}
        </CardContent>
      </Card >

      <InviteUserModal open={inviteOpen} onOpenChange={setInviteOpen} />
      <CreateUserModal open={createOpen} onOpenChange={setCreateOpen} />

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
    </div >
  );
}
