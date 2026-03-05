import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, MoreHorizontal, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { widgetTemplatesApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { useWidgetTemplates } from '@/hooks/use-api';
import type { WidgetTemplate } from '@/types';
import { CreateWidgetTemplateModal } from './CreateWidgetTemplateModal';
import { EditWidgetTemplateModal } from './EditWidgetTemplateModal';

export function WidgetTemplatesTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<WidgetTemplate | null>(null);
  const [toggleTemplate, setToggleTemplate] = useState<WidgetTemplate | null>(null);

  const { data: templates, isLoading } = useWidgetTemplates();

  const toggleMutation = useMutation({
    mutationFn: (id: string) => widgetTemplatesApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-templates'] });
      toast({ title: t('common.success'), description: t('kpiStore.templateToggleSuccess') });
      setToggleTemplate(null);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('common.error'),
        variant: 'destructive',
      });
    },
  });

  const columns: ColumnDef<WidgetTemplate>[] = [
    {
      accessorKey: 'name',
      header: t('kpiStore.templateName'),
      cell: ({ row }) => (
        <Button
          variant="link"
          className="p-0 h-auto font-medium text-primary hover:underline justify-start"
          onClick={() => navigate(`/kpi-store/widget-templates/${row.original.id}`)}
        >
          {row.getValue('name')}
        </Button>
      ),
    },
    {
      accessorKey: 'vizType',
      header: t('kpiStore.templateVizType'),
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{row.getValue('vizType')}</code>
      ),
    },
    {
      accessorKey: 'description',
      header: t('roles.description'),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue('description') || '—'}</span>
      ),
    },
    {
      id: 'config',
      header: t('kpiStore.templateConfig'),
      cell: ({ row }) => (
        <code className="text-xs text-muted-foreground">
          {JSON.stringify(row.original.defaultConfig)}
        </code>
      ),
    },
    {
      accessorKey: 'isActive',
      header: t('common.status'),
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean;
        return isActive ? (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            {t('kpiStore.active')}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            {t('kpiStore.inactive')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const template = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Ouvrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigate(`/kpi-store/widget-templates/${template.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {t('common.view') || 'Voir détails'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditTemplate(template)}>
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className={template.isActive ? 'text-destructive focus:text-destructive' : ''}
                  onClick={() => setToggleTemplate(template)}
                >
                  {template.isActive ? t('kpiStore.deactivate') : t('kpiStore.activate')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('kpiStore.createTemplate')}
        </Button>
      </div>

      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={templates ?? []} searchKey="name" />
      )}

      <CreateWidgetTemplateModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <EditWidgetTemplateModal
        open={editTemplate !== null}
        onOpenChange={(open) => { if (!open) setEditTemplate(null); }}
        template={editTemplate}
      />

      <ConfirmDialog
        open={toggleTemplate !== null}
        onOpenChange={(open) => { if (!open) setToggleTemplate(null); }}
        title={t('kpiStore.toggleConfirmTitle')}
        description={t('kpiStore.toggleConfirmDesc')}
        onConfirm={() => toggleTemplate && toggleMutation.mutate(toggleTemplate.id)}
        isPending={toggleMutation.isPending}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
      />
    </div>
  );
}
