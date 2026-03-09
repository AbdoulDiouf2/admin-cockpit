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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { kpiDefinitionsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import type { KpiDefinition } from '@/types';

const VIZ_TYPES = ['card', 'gauge', 'bar', 'line', 'table', 'pie', 'map', 'text'] as const;

const formSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  code: z.string().optional(),
  domain: z.string().optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'Catégorie requise'),
  subcategory: z.string().optional(),
  unit: z.string().optional(),
  defaultVizType: z.enum(VIZ_TYPES),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: KpiDefinition | null;
}

export function EditKpiDefinitionModal({ open, onOpenChange, kpi }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      domain: '',
      description: '',
      category: '',
      subcategory: '',
      unit: '',
      defaultVizType: 'bar',
    },
  });

  useEffect(() => {
    if (kpi) {
      form.reset({
        name: kpi.name,
        code: kpi.code ?? '',
        domain: kpi.domain ?? '',
        description: kpi.description ?? '',
        category: kpi.category,
        subcategory: kpi.subcategory ?? '',
        unit: kpi.unit ?? '',
        defaultVizType: (VIZ_TYPES.includes(kpi.defaultVizType as any)
          ? kpi.defaultVizType
          : 'bar') as typeof VIZ_TYPES[number],
      });
    }
  }, [kpi, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => kpiDefinitionsApi.update(kpi!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-definitions'] });
      toast({ title: t('common.success'), description: t('kpiStore.kpiUpdateSuccess') });
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {t('kpiStore.editKpi')} — <code className="text-sm">{kpi?.key}</code>
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
                    <FormLabel>{t('kpiStore.kpiName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="KPI-F01" {...field} />
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domaine</FormLabel>
                    <FormControl>
                      <Input placeholder="Finance & Trésorerie" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sous-catégorie</FormLabel>
                    <FormControl>
                      <Input placeholder="Revenus" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('kpiStore.kpiUnit')}</FormLabel>
                    <FormControl>
                      <Input placeholder="€, %, jours" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('kpiStore.kpiCategory')}</FormLabel>
                    <FormControl>
                      <Input placeholder="finance, stock, client…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultVizType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('kpiStore.kpiVizType')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VIZ_TYPES.map((v) => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
