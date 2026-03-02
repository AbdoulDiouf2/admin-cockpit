import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export function UsersPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6" data-testid="users-page">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('users.title')}</h1>
        <p className="text-muted-foreground">{t('users.subtitle')}</p>
      </div>

      {/* Users list placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Liste des utilisateurs
          </CardTitle>
          <CardDescription>
            Tous les utilisateurs de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
            Table des utilisateurs à implémenter
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
