import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building2 } from 'lucide-react';

export function OrganizationsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6" data-testid="organizations-page">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('organizations.title')}</h1>
          <p className="text-muted-foreground">{t('organizations.subtitle')}</p>
        </div>
        <Button data-testid="create-org-btn">
          <Plus className="h-4 w-4 mr-2" />
          {t('organizations.createClient')}
        </Button>
      </div>

      {/* Organizations list placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Liste des organisations
          </CardTitle>
          <CardDescription>
            Toutes les organisations enregistrées sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
            Table des organisations à implémenter
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
