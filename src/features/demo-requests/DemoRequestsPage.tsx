import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarCheck, Loader2, MoreHorizontal } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { demoRequestsApi, DemoRequest, DemoRequestStatus } from '@/api';

const STATUS_BADGE: Record<DemoRequestStatus, { label: string; className: string }> = {
  NEW: { label: 'Nouveau', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  CONTACTED: { label: 'Contacté', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  DEMO_SCHEDULED: { label: 'Démo planifiée', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  CONVERTED: { label: 'Converti', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  REJECTED: { label: 'Rejeté', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

const ALL_STATUSES: DemoRequestStatus[] = ['NEW', 'CONTACTED', 'DEMO_SCHEDULED', 'CONVERTED', 'REJECTED'];

export function DemoRequestsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<DemoRequestStatus | ''>('');
  const [editRequest, setEditRequest] = useState<DemoRequest | null>(null);
  const [editStatus, setEditStatus] = useState<DemoRequestStatus>('NEW');
  const [editNotes, setEditNotes] = useState('');
  const [deleteRequest, setDeleteRequest] = useState<DemoRequest | null>(null);

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ['demo-requests', statusFilter],
    queryFn: async () => {
      const resp = await demoRequestsApi.getAll(statusFilter || undefined);
      return resp.data;
    },
  });

  const filteredRequests = useMemo(() => requests ?? [], [requests]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: DemoRequestStatus; notes?: string } }) =>
      demoRequestsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-requests'] });
      toast({ title: t('common.success'), description: t('demoRequests.updateSuccess') });
      setEditRequest(null);
    },
    onError: (err: any) => {
      toast({
        title: t('common.error'),
        description: err.response?.data?.message || t('demoRequests.updateError'),
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => demoRequestsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-requests'] });
      toast({ title: t('common.success'), description: t('demoRequests.deleteSuccess') });
      setDeleteRequest(null);
    },
    onError: (err: any) => {
      toast({
        title: t('common.error'),
        description: err.response?.data?.message || t('demoRequests.deleteError'),
        variant: 'destructive',
      });
    },
  });

  function openEdit(req: DemoRequest) {
    setEditRequest(req);
    setEditStatus(req.status);
    setEditNotes(req.notes ?? '');
  }

  const columns: ColumnDef<DemoRequest>[] = [
    {
      accessorKey: 'createdAt',
      header: t('demoRequests.columns.date'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {format(new Date(row.getValue('createdAt')), 'dd/MM/yyyy HH:mm')}
        </span>
      ),
    },
    {
      accessorKey: 'email',
      header: t('demoRequests.columns.email'),
      cell: ({ row }) => (
        <a
          href={`mailto:${row.getValue('email')}`}
          className="text-primary hover:underline text-sm font-medium"
        >
          {row.getValue('email')}
        </a>
      ),
    },
    {
      accessorKey: 'company',
      header: t('demoRequests.columns.company'),
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.getValue('company')}</span>
      ),
    },
    {
      accessorKey: 'message',
      header: t('demoRequests.columns.message'),
      cell: ({ row }) => {
        const msg = row.getValue('message') as string | undefined;
        if (!msg) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <span
            className="text-sm text-muted-foreground max-w-[220px] truncate block"
            title={msg}
          >
            {msg}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: t('demoRequests.columns.status'),
      cell: ({ row }) => {
        const status = row.getValue('status') as DemoRequestStatus;
        const badge = STATUS_BADGE[status];
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
            {badge.label}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const req = row.original;
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
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(req.email)}>
                  Copier l'email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openEdit(req)}>
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteRequest(req)}
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
    <div className="space-y-6" data-testid="demo-requests-page">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('demoRequests.title')}</h1>
        <p className="text-muted-foreground">{t('demoRequests.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            {t('demoRequests.listTitle')}
          </CardTitle>
          <CardDescription>{t('demoRequests.listSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="h-[400px] flex items-center justify-center text-destructive">
              Erreur lors du chargement des demandes
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredRequests}
              searchKey="email"
              extraFilters={
                <FilterBar
                  filters={[
                    {
                      key: 'status',
                      label: t('demoRequests.columns.status'),
                      options: ALL_STATUSES.map((s) => ({
                        label: STATUS_BADGE[s].label,
                        value: s,
                      })),
                      value: statusFilter,
                      onChange: (v) => setStatusFilter(v as DemoRequestStatus | ''),
                    },
                  ]}
                  onReset={() => setStatusFilter('')}
                  hasActiveFilters={statusFilter !== ''}
                />
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Edit modal */}
      <Dialog open={editRequest !== null} onOpenChange={(open) => { if (!open) setEditRequest(null); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{t('demoRequests.edit.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-muted-foreground">
                {editRequest?.company} — <span className="font-normal">{editRequest?.email}</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>{t('demoRequests.edit.status')}</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as DemoRequestStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_BADGE[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t('demoRequests.edit.notes')}</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder={t('demoRequests.edit.notesPlaceholder')}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRequest(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() =>
                editRequest &&
                updateMutation.mutate({
                  id: editRequest.id,
                  data: { status: editStatus, notes: editNotes || undefined },
                })
              }
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteRequest !== null}
        onOpenChange={(open) => { if (!open) setDeleteRequest(null); }}
        title={t('demoRequests.deleteConfirmTitle')}
        description={t('demoRequests.deleteConfirmDesc', { company: deleteRequest?.company ?? '' })}
        onConfirm={() => deleteRequest && deleteMutation.mutate(deleteRequest.id)}
        isPending={deleteMutation.isPending}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
