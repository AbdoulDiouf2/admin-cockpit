import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { KpiDefinitionsTab } from './KpiDefinitionsTab';
import { WidgetTemplatesTab } from './WidgetTemplatesTab';
import { KpiPacksTab } from './KpiPacksTab';
import { CreateKpiDefinitionModal } from './CreateKpiDefinitionModal';
import { CreateWidgetTemplateModal } from './CreateWidgetTemplateModal';
import { CreateKpiPackModal } from './CreateKpiPackModal';

export function KpiStorePage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'definitions';
  const handleTabChange = (tab: string) => setSearchParams({ tab }, { replace: true });

  const [isCreateKpiOpen, setIsCreateKpiOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [isCreatePackOpen, setIsCreatePackOpen] = useState(false);

  const createButton = {
    definitions: { label: t('kpiStore.createKpi'), onClick: () => setIsCreateKpiOpen(true) },
    templates:   { label: t('kpiStore.createTemplate'), onClick: () => setIsCreateTemplateOpen(true) },
    packs:       { label: t('kpiStore.createPack'), onClick: () => setIsCreatePackOpen(true) },
  }[activeTab];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('kpiStore.title')}</h1>
          <p className="text-muted-foreground">{t('kpiStore.subtitle')}</p>
        </div>
        {createButton && (
          <Button onClick={createButton.onClick}>
            <Plus className="h-4 w-4 mr-2" />
            {createButton.label}
          </Button>
        )}
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
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6">
              <TabsTrigger value="definitions">{t('kpiStore.tabDefinitions')}</TabsTrigger>
              <TabsTrigger value="templates">{t('kpiStore.tabTemplates')}</TabsTrigger>
              <TabsTrigger value="packs">{t('kpiStore.tabPacks')}</TabsTrigger>
            </TabsList>

            <TabsContent value="definitions">
              <KpiDefinitionsTab onCreateClick={() => setIsCreateKpiOpen(true)} />
            </TabsContent>

            <TabsContent value="templates">
              <WidgetTemplatesTab onCreateClick={() => setIsCreateTemplateOpen(true)} />
            </TabsContent>

            <TabsContent value="packs">
              <KpiPacksTab onCreateClick={() => setIsCreatePackOpen(true)} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <CreateKpiDefinitionModal open={isCreateKpiOpen} onOpenChange={setIsCreateKpiOpen} />
      <CreateWidgetTemplateModal open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen} />
      <CreateKpiPackModal open={isCreatePackOpen} onOpenChange={setIsCreatePackOpen} />
    </div>
  );
}
