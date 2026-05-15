import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { widgetTemplatesApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import type { WidgetTemplate } from '@/types';

const formSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  subtype: z.string().optional(),
  description: z.string().optional(),
  defaultConfig: z.string().refine((v) => {
    try { JSON.parse(v); return true; } catch { return false; }
  }, 'JSON invalide'),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: WidgetTemplate | null;
}

export function EditWidgetTemplateModal({ open, onOpenChange, template }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', subtype: 'default', description: '', defaultConfig: '{}' },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        subtype: template.subtype ?? 'default',
        description: template.description ?? '',
        defaultConfig: JSON.stringify(template.defaultConfig, null, 2),
      });
    }
  }, [template, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      widgetTemplatesApi.update(template!.id, {
        name: values.name,
        subtype: values.subtype || 'default',
        description: values.description,
        defaultConfig: JSON.parse(values.defaultConfig),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-templates'] });
      toast({ title: t('common.success'), description: t('kpiStore.templateUpdateSuccess') });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.message || t('common.error'),
        variant: 'destructive',
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {t('kpiStore.editTemplate')} —{' '}
            <code className="text-sm">{template?.vizType}</code>
            {template?.subtype && template.subtype !== 'default' && (
              <code className="text-sm ml-1 text-muted-foreground">/{template.subtype}</code>
            )}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('kpiStore.templateName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subtype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtype</FormLabel>
                    <FormControl>
                      <Input placeholder="default" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('roles.description')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultConfig"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('kpiStore.templateConfig')}</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
