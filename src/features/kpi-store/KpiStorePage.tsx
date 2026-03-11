import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KpiDefinitionsTab } from './KpiDefinitionsTab';
import { WidgetTemplatesTab } from './WidgetTemplatesTab';
import { KpiPacksTab } from './KpiPacksTab';

export function KpiStorePage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'definitions');

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('kpiStore.title')}</h1>
        <p className="text-muted-foreground">{t('kpiStore.subtitle')}</p>
      </div>

      {/* Tabbed content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('kpiStore.title')}
          </CardTitle>
          <CardDescription>{t('kpiStore.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="definitions">{t('kpiStore.tabDefinitions')}</TabsTrigger>
              <TabsTrigger value="templates">{t('kpiStore.tabTemplates')}</TabsTrigger>
              <TabsTrigger value="packs">{t('kpiStore.tabPacks')}</TabsTrigger>
            </TabsList>

            <TabsContent value="definitions">
              <KpiDefinitionsTab />
            </TabsContent>

            <TabsContent value="templates">
              <WidgetTemplatesTab />
            </TabsContent>

            <TabsContent value="packs">
              <KpiPacksTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
