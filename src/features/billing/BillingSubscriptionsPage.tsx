import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { useAdminBillingSubscriptions } from '@/hooks/use-api';
import { BillingSubscription, BillingStatus, Organization } from '@/types';
import { CreditCard, Users, TrendingUp, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

function StatusBadge({ status }: { status: BillingStatus }) {
  const { t } = useTranslation();
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

  const subscriptions = data?.subscriptions ?? [];
  const unsubscribed = data?.unsubscribed ?? [];
  const summary = data?.summary;

  // Combine into rows — subscribed orgs have a sub, unsubscribed don't
  const allRows: Array<{ org: Organization; sub: BillingSubscription | null }> = [
    ...subscriptions.map((s) => ({ org: s.organization!, sub: s })),
    ...unsubscribed.map((o) => ({ org: o, sub: null })),
  ];

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
          <StatusBadge status={sub.status} />
        ) : (
          <Badge variant="outline">{t('billingAdmin.noSubscription')}</Badge>
        );
      },
    },
    {
      id: 'periodEnd',
      header: t('billingAdmin.columnPeriodEnd'),
      cell: ({ row }) => {
        const sub = row.original.sub;
        return sub ? (
          <span className="text-sm">{new Date(sub.currentPeriodEnd).toLocaleDateString('fr-FR')}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
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
          <DataTable columns={columns} data={allRows} />
        </CardContent>
      </Card>
    </div>
  );
}
