import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Plus } from 'lucide-react';

export function RolesPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6" data-testid="roles-page">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('roles.title')}</h1>
          <p className="text-muted-foreground">{t('roles.subtitle')}</p>
        </div>
        <Button data-testid="create-role-btn">
          <Plus className="h-4 w-4 mr-2" />
          {t('roles.createRole')}
        </Button>
      </div>

      {/* Roles list placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestion des rôles
          </CardTitle>
          <CardDescription>
            Définissez les rôles et leurs permissions associées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
            Table des rôles à implémenter
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
