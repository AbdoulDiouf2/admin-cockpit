import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Loader2, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useSubscriptionPlans } from '@/hooks/use-api';
import { subscriptionPlansApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionPlan } from '@/types';
import { CreateSubscriptionPlanModal } from './CreateSubscriptionPlanModal';
import { EditSubscriptionPlanModal } from './EditSubscriptionPlanModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function SubscriptionPlansPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);
  const [deactivatePlan, setDeactivatePlan] = useState<SubscriptionPlan | null>(null);

  const { data: plans, isLoading, error } = useSubscriptionPlans();

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => subscriptionPlansApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: t('common.success'),
        description: t('subscriptionPlans.deactivateSuccess'),
      });
      setDeactivatePlan(null);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('common.error'),
        variant: 'destructive',
      });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (plan: SubscriptionPlan) =>
      subscriptionPlansApi.update(plan.id, { isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({
        title: t('common.success'),
        description: t('subscriptionPlans.reactivateSuccess'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('common.error'),
        variant: 'destructive',
      });
    },
  });

  const columns: ColumnDef<SubscriptionPlan>[] = [
    {
      accessorKey: 'label',
      header: 'Plan',
      cell: ({ row }) => {
        const plan = row.original;
        return (
          <div className="flex items-center gap-2">
            <Link
              to={`/subscription-plans/${plan.id}`}
              className="font-medium text-primary hover:underline"
            >
              {plan.label}
            </Link>
            {!plan.isActive && (
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {t('subscriptionPlans.inactive')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: t('subscriptionPlans.name'),
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.getValue('name')}</code>
      ),
    },
    {
      accessorKey: 'priceMonthly',
      header: t('subscriptionPlans.priceMonthly'),
      cell: ({ row }) => {
        const price = row.getValue('priceMonthly') as number | null | undefined;
        return (
          <span className="text-sm">
            {price != null ? `${price.toLocaleString()} FCFA/mois` : t('subscriptionPlans.customPricing')}
          </span>
        );
      },
    },
    {
      id: 'limits',
      header: 'Limites',
      cell: ({ row }) => {
        const plan = row.original;
        const users = plan.maxUsers != null ? plan.maxUsers : '∞';
        const kpis = plan.maxKpis != null ? plan.maxKpis : '∞';
        return (
          <span className="text-sm text-muted-foreground">
            {users} users / {kpis} KPIs
          </span>
        );
      },
    },
    {
      accessorKey: 'hasNlq',
      header: 'NLQ',
      cell: ({ row }) => {
        const hasNlq = row.getValue('hasNlq') as boolean | undefined;
        return hasNlq ? (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            {t('subscriptionPlans.active')}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
            —
          </span>
        );
      },
    },
    {
      id: 'organizations',
      header: t('subscriptionPlans.organizations'),
      cell: ({ row }) => {
        const count = row.original._count?.organizations ?? 0;
        return <span className="text-sm">{count}</span>;
      },
    },
    {
      accessorKey: 'isActive',
      header: t('common.status'),
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean | undefined;
        return isActive ? (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            {t('subscriptionPlans.active')}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            {t('subscriptionPlans.inactive')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const plan = row.original;
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
                <DropdownMenuItem onClick={() => setEditPlan(plan)}>
                  {t('subscriptionPlans.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {plan.isActive ? (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeactivatePlan(plan)}
                  >
                    {t('subscriptionPlans.deactivate')}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => reactivateMutation.mutate(plan)}>
                    {t('subscriptionPlans.reactivate')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('subscriptionPlans.title')}</h1>
          <p className="text-muted-foreground">{t('subscriptionPlans.subtitle')}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('subscriptionPlans.create')}
        </Button>
      </div>

      {/* Plans list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('subscriptionPlans.title')}
          </CardTitle>
          <CardDescription>{t('subscriptionPlans.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="h-[400px] flex items-center justify-center text-destructive">
              Erreur lors du chargement des plans
            </div>
          ) : (
            <DataTable columns={columns} data={plans ?? []} searchKey="label" />
          )}
        </CardContent>
      </Card>

      <CreateSubscriptionPlanModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <EditSubscriptionPlanModal
        open={editPlan !== null}
        onOpenChange={(open) => { if (!open) setEditPlan(null); }}
        plan={editPlan}
      />

      <ConfirmDialog
        open={deactivatePlan !== null}
        onOpenChange={(open) => { if (!open) setDeactivatePlan(null); }}
        title={t('subscriptionPlans.deactivateConfirm')}
        description={t('subscriptionPlans.deactivateDesc')}
        onConfirm={() => deactivatePlan && deactivateMutation.mutate(deactivatePlan.id)}
        isPending={deactivateMutation.isPending}
        confirmLabel={t('subscriptionPlans.deactivate')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
