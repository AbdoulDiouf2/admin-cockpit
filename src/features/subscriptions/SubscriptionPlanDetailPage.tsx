import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscriptionPlan } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CreditCard, Users, Zap, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export function SubscriptionPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: plan, isLoading, error } = useSubscriptionPlan(id!);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !plan) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <p className="text-destructive font-medium">{t('common.error')}</p>
        <Button onClick={() => navigate('/subscription-plans')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/subscription-plans')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{plan.label}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Informations Générales
            </CardTitle>
            <CardDescription>Détails techniques et tarification du plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID Technique</p>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{plan.name}</code>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prix Mensuel</p>
                <p className="text-lg font-bold">
                  {plan.priceMonthly != null ? `${plan.priceMonthly.toLocaleString()} FCFA` : 'Sur devis'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Statut</p>
                {plan.isActive ? (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Actif
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Inactif
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Organisations</p>
                <p className="text-lg font-semibold">{plan._count?.organizations ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Limites
            </CardTitle>
            <CardDescription>Restrictions de ressources</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Utilisateurs Max</span>
              <span className="font-semibold">{plan.maxUsers ?? '∞'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">KPIs Max</span>
              <span className="font-semibold">{plan.maxKpis ?? '∞'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Widgets Max</span>
              <span className="font-semibold">{plan.maxWidgets ?? '∞'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Sync. Agent / jour</span>
              <span className="font-semibold">{plan.maxAgentSyncPerDay ?? '∞'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Fonctionnalités
            </CardTitle>
            <CardDescription>Options incluses dans ce plan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <FeatureItem
                label="NLQ (Natural Language Query)"
                enabled={!!plan.hasNlq}
              />
              <FeatureItem
                label="Rapports Avancés"
                enabled={!!plan.hasAdvancedReports}
              />
              <FeatureItem
                label="Packs KPI Autorisés"
                enabled={true}
                value={plan.allowedKpiPacks?.join(', ') || 'Tous'}
              />
              <FeatureItem
                label="Ordre d'affichage"
                enabled={true}
                value={plan.sortOrder?.toString() || '0'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Flutterwave Config */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Configuration Flutterwave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Plan ID</p>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {plan.fwPlanId || <span className="text-muted-foreground italic">Non configuré</span>}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FeatureItem({ label, enabled, value }: { label: string; enabled: boolean; value?: string }) {
  return (
    <div className="flex items-start gap-2">
      {enabled ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
      ) : (
        <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
      )}
      <div>
        <p className="text-sm font-medium leading-none">{label}</p>
        {value && <p className="text-xs text-muted-foreground mt-1">{value}</p>}
      </div>
    </div>
  );
}
