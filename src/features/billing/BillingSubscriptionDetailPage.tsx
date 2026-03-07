import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminBillingSubscription } from '@/hooks/use-api';
import { BillingStatus } from '@/types';
import { ArrowLeft, CreditCard, FileText, Loader2, ExternalLink } from 'lucide-react';

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function BillingSubscriptionDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const { data, isLoading, error } = useAdminBillingSubscription(orgId ?? '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-destructive">
        Erreur lors du chargement des données de facturation.
      </div>
    );
  }

  const { organization, subscription, hasSubscription } = data;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/billing-subscriptions')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('billingAdmin.backToList')}
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">{t('billingAdmin.detailTitle')}</h1>
        <p className="text-muted-foreground">
          {t('billingAdmin.detailSubtitle')} <span className="font-medium text-foreground">{organization.name}</span>
        </p>
      </div>

      {!hasSubscription || !subscription ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t('billingAdmin.noSubscriptionDetail')}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" />
                  Abonnement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <StatusBadge status={subscription.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{subscription.plan?.label ?? subscription.planId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Début période</span>
                  <span>{formatDate(subscription.currentPeriodStart)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fin période</span>
                  <span>{formatDate(subscription.currentPeriodEnd)}</span>
                </div>
                {subscription.trialEndsAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fin essai</span>
                    <span>{formatDate(subscription.trialEndsAt)}</span>
                  </div>
                )}
                {subscription.cancelAtPeriodEnd && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      {t('billingAdmin.cancelAtPeriodEnd')}
                    </Badge>
                  </div>
                )}
                {subscription.cancelledAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annulé le</span>
                    <span>{formatDate(subscription.cancelledAt)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client Flutterwave</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {subscription.customer ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email</span>
                      <span>{subscription.customer.email}</span>
                    </div>
                    {subscription.customer.fwCustomerId && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">FW Customer ID</span>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">{subscription.customer.fwCustomerId}</code>
                      </div>
                    )}
                    {subscription.fwSubscriptionId && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">FW Subscription ID</span>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">{subscription.fwSubscriptionId}</code>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                {t('billingAdmin.invoicesTitle')}
              </CardTitle>
              <CardDescription>
                {subscription.invoices?.length
                  ? `${subscription.invoices.length} facture(s)`
                  : t('billingAdmin.invoicesEmpty')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!subscription.invoices?.length ? (
                <p className="text-sm text-muted-foreground">{t('billingAdmin.invoicesEmpty')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium text-muted-foreground">{t('billingAdmin.invoiceDate')}</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">{t('billingAdmin.invoiceAmount')}</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">{t('billingAdmin.invoiceStatus')}</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">{t('billingAdmin.invoicePdf')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscription.invoices.map((inv) => (
                        <tr key={inv.id} className="border-b last:border-0">
                          <td className="py-2">{inv.paidAt ? formatDate(inv.paidAt) : '—'}</td>
                          <td className="py-2 font-medium">{formatXof(inv.amountPaid)}</td>
                          <td className="py-2">
                            <Badge variant={inv.status === 'paid' ? 'default' : 'outline'} className="text-xs">
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="py-2">
                            {inv.pdfUrl ? (
                              <a
                                href={inv.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                              >
                                {t('billingAdmin.invoiceView')}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
