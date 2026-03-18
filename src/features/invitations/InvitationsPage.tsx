import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { useAllInvitations, useOrganizations } from '@/hooks/use-api';
import { ColumnDef } from '@tanstack/react-table';
import { Invitation } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export function InvitationsPage() {
    const { t } = useTranslation();
    const [filterOrg, setFilterOrg] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const { data: invitations, isLoading } = useAllInvitations();
    const { data: organizations } = useOrganizations();

    const orgOptions = useMemo(() => {
        if (!organizations) return [];
        return organizations
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((o) => ({ label: o.name, value: o.id }));
    }, [organizations]);

    const filteredInvitations = useMemo(() => {
        if (!invitations) return [];
        return invitations.filter((inv) => {
            if (filterOrg && inv.organizationId !== filterOrg) return false;
            if (filterStatus) {
                const expired = isPast(new Date(inv.expiresAt)) && !inv.isAccepted;
                const status = inv.isAccepted ? 'accepted' : (expired ? 'expired' : 'pending');
                if (status !== filterStatus) return false;
            }
            return true;
        });
    }, [invitations, filterOrg, filterStatus]);

    const hasActiveFilters = filterOrg !== '' || filterStatus !== '';
    const resetFilters = () => { setFilterOrg(''); setFilterStatus(''); };

    const columns: ColumnDef<Invitation>[] = [
        {
            accessorKey: 'firstName',
            header: t('invitations.columnGuest'),
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium">
                        {row.original.firstName} {row.original.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">{row.original.email}</span>
                </div>
            ),
        },
        {
            accessorKey: 'organization.name',
            header: t('invitations.columnOrg'),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{row.original.organization?.name}</span>
                </div>
            ),
        },
        {
            accessorKey: 'role.name',
            header: t('invitations.columnRole'),
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize">
                    {row.original.role?.name}
                </Badge>
            ),
        },
        {
            accessorKey: 'invitedBy.email',
            header: t('invitations.columnSponsor'),
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-sm">
                        {row.original.invitedBy?.firstName} {row.original.invitedBy?.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">{row.original.invitedBy?.email}</span>
                </div>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: t('invitations.columnDate'),
            cell: ({ row }) => format(new Date(row.original.createdAt), 'dd/MM/yyyy HH:mm'),
        },
        {
            accessorKey: 'status',
            header: t('invitations.columnStatus'),
            cell: ({ row }) => {
                const inv = row.original;
                const expired = isPast(new Date(inv.expiresAt)) && !inv.isAccepted;

                if (inv.isAccepted) {
                    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">{t('invitations.statusAccepted')}</Badge>;
                }
                if (expired) {
                    return <Badge variant="destructive">{t('invitations.statusExpired')}</Badge>;
                }
                return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">{t('invitations.statusPending')}</Badge>;
            },
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{t('invitations.title')}</h1>
                <p className="text-muted-foreground">
                    {t('invitations.subtitle')}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('invitations.listTitle')}</CardTitle>
                    <CardDescription>
                        {t('invitations.listSubtitle')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={filteredInvitations}
                        isLoading={isLoading}
                        searchKey="email"
                        extraFilters={
                            <FilterBar
                                filters={[
                                    {
                                        key: 'org',
                                        label: t('invitations.columnOrg'),
                                        options: orgOptions,
                                        value: filterOrg,
                                        onChange: setFilterOrg,
                                    },
                                    {
                                        key: 'status',
                                        label: t('invitations.columnStatus'),
                                        options: [
                                            { label: t('invitations.statusPending'), value: 'pending' },
                                            { label: t('invitations.statusAccepted'), value: 'accepted' },
                                            { label: t('invitations.statusExpired'), value: 'expired' },
                                        ],
                                        value: filterStatus,
                                        onChange: setFilterStatus,
                                    },
                                ]}
                                onReset={resetFilters}
                                hasActiveFilters={hasActiveFilters}
                            />
                        }
                    />
                </CardContent>
            </Card>
        </div>
    );
}
