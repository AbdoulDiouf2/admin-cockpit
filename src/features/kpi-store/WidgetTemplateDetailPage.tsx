import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  LayoutTemplate,
  Settings2,
  Code2,
  CheckCircle2,
  XCircle,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useWidgetTemplate } from '@/hooks/use-api';
import { widgetTemplatesApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { EditWidgetTemplateModal } from './EditWidgetTemplateModal';

export function WidgetTemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isToggleOpen, setIsToggleOpen] = useState(false);

  const { data: template, isLoading, error } = useWidgetTemplate(id!);

  const toggleMutation = useMutation({
    mutationFn: (templateId: string) => widgetTemplatesApi.toggle(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-templates'] });
      queryClient.invalidateQueries({ queryKey: ['widget-templates', id] });
      toast({ title: t('common.success'), description: t('kpiStore.templateToggleSuccess') });
      setIsToggleOpen(false);
    },
    onError: (err: any) => {
      toast({
        title: t('common.error'),
        description: err.response?.data?.message || t('common.error'),
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !template) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <p className="text-destructive font-medium">{t('common.error')}</p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const formattedDate = new Date(template.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
            <code className="text-sm bg-muted px-2 py-0.5 rounded text-primary">
              {template.vizType}
            </code>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            {t('common.edit')}
          </Button>
          <Button
            variant={template.isActive ? 'destructive' : 'default'}
            onClick={() => setIsToggleOpen(true)}
          >
            {template.isActive ? t('kpiStore.deactivate') : t('kpiStore.activate')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Informations générales */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutTemplate className="h-5 w-5 text-primary" />
              {t('kpiStore.templateInfo') || 'Informations générales'}
            </CardTitle>
            <CardDescription>
              {t('kpiStore.templateInfoDesc') || 'Détails du template de visualisation'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('kpiStore.templateName')}
                </p>
                <p className="font-semibold">{template.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('kpiStore.templateVizType')}
                </p>
                <code className="text-sm bg-muted px-1.5 py-0.5 rounded">{template.vizType}</code>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('common.status')}</p>
                {template.isActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('kpiStore.active')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    <XCircle className="h-3 w-3" />
                    {t('kpiStore.inactive')}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('common.createdAt') || 'Créé le'}</p>
                <p className="text-sm">{formattedDate}</p>
              </div>
            </div>
            {template.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statut rapide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              {t('kpiStore.templateStatus') || 'Statut'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Actif</span>
              {template.isActive ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Type de viz.</span>
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{template.vizType}</code>
            </div>
          </CardContent>
        </Card>

        {/* Configuration par défaut */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              {t('kpiStore.templateConfig') || 'Configuration par défaut'}
            </CardTitle>
            <CardDescription>
              {t('kpiStore.templateConfigDesc') || 'Paramètres JSON appliqués par défaut lors de l\'ajout de ce widget'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto leading-relaxed">
              {JSON.stringify(template.defaultConfig, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>

      <EditWidgetTemplateModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        template={template}
      />

      <ConfirmDialog
        open={isToggleOpen}
        onOpenChange={setIsToggleOpen}
        title={t('kpiStore.toggleConfirmTitle')}
        description={t('kpiStore.toggleConfirmDesc')}
        onConfirm={() => toggleMutation.mutate(template.id)}
        isPending={toggleMutation.isPending}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
