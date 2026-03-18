import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { useAdminBillingSubscriptions } from '@/hooks/use-api';
import { BillingSubscription, BillingStatus, Organization } from '@/types';
import { CreditCard, Users, TrendingUp, AlertTriangle, XCircle, Loader2, Clock } from 'lucide-react';
import { differenceInDays } from 'date-fns';

function StatusBadge({ status, trialEndsAt }: { status: BillingStatus; trialEndsAt?: string | null }) {
  const { t } = useTranslation();

  if (status === 'TRIALING' && trialEndsAt) {
    const days = differenceInDays(new Date(trialEndsAt), new Date());
    const expired = days < 0;
    return (
      <div className="flex flex-col gap-0.5">
        <Badge variant="secondary" className={expired ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200'}>
          <Clock className="w-3 h-3 mr-1" />
          {expired ? 'Essai expiré' : days === 0 ? 'Essai · dernier jour' : `Essai · J-${days}`}
        </Badge>
        {!expired && (
          <span className="text-[10px] text-muted-foreground pl-0.5">
            Fin le {new Date(trialEndsAt).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>
    );
  }

  const map: Record<BillingStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    ACTIVE:    { label: t('billingAdmin.statusActive'),    variant: 'default' },
    TRIALING:  { label: t('billingAdmin.statusTrialing'),  variant: 'secondary' },
    PAST_DUE:  { label: t('billingAdmin.statusPastDue'),   variant: 'destructive' },
    CANCELLED: { label: t('billingAdmin.statusCancelled'), variant: 'outline' },
    UNPAID:    { label: t('billingAdmin.statusUnpaid'),    variant: 'destructive' },
    PAUSED:    { label: t('billingAdmin.statusPaused'),    variant: 'secondary' },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function formatXof(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
}

export function BillingSubscriptionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, error } = useAdminBillingSubscriptions();
  const [filterPlan, setFilterPlan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const subscriptions = data?.subscriptions ?? [];
  const unsubscribed = data?.unsubscribed ?? [];
  const summary = data?.summary;

  // Combine into rows — subscribed orgs have a sub, unsubscribed don't
  const allRows: Array<{ org: Organization; sub: BillingSubscription | null }> = [
    ...subscriptions.map((s) => ({ org: s.organization!, sub: s })),
    ...unsubscribed.map((o) => ({ org: o, sub: null })),
  ];

  const planOptions = useMemo(() => {
    const plans = [...new Map(
      subscriptions.filter((s) => s.plan).map((s) => [s.plan!.name, s.plan!.label])
    ).entries()];
    return plans.sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => ({ label, value }));
  }, [subscriptions]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (filterPlan && row.sub?.plan?.name !== filterPlan) return false;
      if (filterStatus) {
        const rowStatus = row.sub?.status ?? 'NONE';
        if (rowStatus !== filterStatus) return false;
      }
      return true;
    });
  }, [allRows, filterPlan, filterStatus]);

  const hasActiveFilters = filterPlan !== '' || filterStatus !== '';
  const resetFilters = () => { setFilterPlan(''); setFilterStatus(''); };

  const columns: ColumnDef<{ org: Organization; sub: BillingSubscription | null }>[] = [
    {
      id: 'organization',
      header: t('billingAdmin.columnOrg'),
      cell: ({ row }) => (
        <div className="font-medium">{row.original.org.name}</div>
      ),
    },
    {
      id: 'plan',
      header: t('billingAdmin.columnPlan'),
      cell: ({ row }) => {
        const plan = row.original.sub?.plan;
        return plan ? (
          <span className="text-sm font-medium">{plan.label}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      id: 'status',
      header: t('billingAdmin.columnStatus'),
      cell: ({ row }) => {
        const sub = row.original.sub;
        return sub ? (
          <StatusBadge status={sub.status} trialEndsAt={sub.trialEndsAt} />
        ) : (
          <Badge variant="outline">{t('billingAdmin.noSubscription')}</Badge>
        );
      },
    },
    {
      id: 'periodEnd',
      header: 'Échéance',
      cell: ({ row }) => {
        const sub = row.original.sub;
        if (!sub) return <span className="text-xs text-muted-foreground">—</span>;
        const isTrial = sub.status === 'TRIALING' && sub.trialEndsAt;
        const date = isTrial ? new Date(sub.trialEndsAt!) : new Date(sub.currentPeriodEnd);
        const daysLeft = differenceInDays(date, new Date());
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">{date.toLocaleDateString('fr-FR')}</span>
            {daysLeft >= 0 && daysLeft <= 7 && (
              <span className="text-[10px] text-orange-600 font-medium">
                {daysLeft === 0 ? 'Aujourd\'hui' : `dans ${daysLeft}j`}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'lastPayment',
      header: t('billingAdmin.columnAmount'),
      cell: ({ row }) => {
        const invoice = row.original.sub?.invoices?.[0];
        return invoice ? (
          <span className="text-sm font-medium">{formatXof(invoice.amountPaid)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/billing-subscriptions/${row.original.org.id}`)}
        >
          {t('billingAdmin.viewDetail')}
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-destructive">
        Erreur lors du chargement des données de facturation.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t('billingAdmin.title')}</h1>
        <p className="text-muted-foreground">{t('billingAdmin.subtitle')}</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('billingAdmin.total')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('billingAdmin.active')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('billingAdmin.trialing')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{summary.trialing}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('billingAdmin.pastDue')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.pastDue}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('billingAdmin.cancelled')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{summary.cancelled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('billingAdmin.neverSubscribed')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{summary.neverSubscribed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('billingAdmin.tableTitle')}
          </CardTitle>
          <CardDescription>{allRows.length} organisations</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredRows}
            extraFilters={
              <FilterBar
                filters={[
                  {
                    key: 'plan',
                    label: t('billingAdmin.columnPlan'),
                    options: planOptions,
                    value: filterPlan,
                    onChange: setFilterPlan,
                  },
                  {
                    key: 'status',
                    label: t('billingAdmin.columnStatus'),
                    options: [
                      { label: t('billingAdmin.statusActive'), value: 'ACTIVE' },
                      { label: t('billingAdmin.statusTrialing'), value: 'TRIALING' },
                      { label: t('billingAdmin.statusPastDue'), value: 'PAST_DUE' },
                      { label: t('billingAdmin.statusCancelled'), value: 'CANCELLED' },
                      { label: t('billingAdmin.statusUnpaid'), value: 'UNPAID' },
                      { label: t('billingAdmin.statusPaused'), value: 'PAUSED' },
                      { label: t('billingAdmin.noSubscription'), value: 'NONE' },
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
