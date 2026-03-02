import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cpu, Key } from 'lucide-react';

export function AgentsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6" data-testid="agents-page">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('agents.title')}</h1>
          <p className="text-muted-foreground">{t('agents.subtitle')}</p>
        </div>
        <Button data-testid="generate-token-btn">
          <Key className="h-4 w-4 mr-2" />
          {t('agents.generateToken')}
        </Button>
      </div>

      {/* Agents list placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Agents on-premise
          </CardTitle>
          <CardDescription>
            Monitoring des agents déployés chez les clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
            Table des agents à implémenter
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
