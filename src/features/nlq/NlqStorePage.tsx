import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NlqIntentsTab } from './NlqIntentsTab';
import { NlqTemplatesTab } from './NlqTemplatesTab';
import { NlqSessionsTab } from './NlqSessionsTab';

export function NlqStorePage() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'intents';
    const handleTabChange = (tab: string) => setSearchParams({ tab }, { replace: true });

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('nlqStore.title')}</h1>
                <p className="text-muted-foreground">{t('nlqStore.subtitle')}</p>
            </div>

            {/* Tabbed content */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        {t('nlqStore.title')}
                    </CardTitle>
                    <CardDescription>{t('nlqStore.subtitle')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={handleTabChange}>
                        <TabsList className="mb-6">
                            <TabsTrigger value="intents">{t('nlqStore.tabIntents')}</TabsTrigger>
                            <TabsTrigger value="templates">{t('nlqStore.tabTemplates')}</TabsTrigger>
                            <TabsTrigger value="sessions">{t('nlqStore.tabSessions')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="intents">
                            <NlqIntentsTab />
                        </TabsContent>

                        <TabsContent value="templates">
                            <NlqTemplatesTab />
                        </TabsContent>

                        <TabsContent value="sessions">
                            <NlqSessionsTab />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
