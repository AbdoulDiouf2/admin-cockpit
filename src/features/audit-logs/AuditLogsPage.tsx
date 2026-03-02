import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText } from 'lucide-react';

export function AuditLogsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6" data-testid="audit-logs-page">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('auditLogs.title')}</h1>
        <p className="text-muted-foreground">{t('auditLogs.subtitle')}</p>
      </div>

      {/* Audit logs list placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Historique des actions
          </CardTitle>
          <CardDescription>
            Toutes les actions effectuées sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
            Table des logs d'audit à implémenter
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
