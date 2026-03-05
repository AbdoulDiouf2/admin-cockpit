import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { kpiPacksApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import type { KpiPack } from '@/types';
import { useKpiDefinitions } from '@/hooks/use-api';

const formSchema = z.object({
  label: z.string().min(1, 'Nom affiché requis'),
  profile: z.enum(['daf', 'dg', 'controller', 'manager', 'analyst']),
  kpiKeys: z.array(z.string()).min(1, 'Au moins un KPI requis'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pack: KpiPack | null;
}

export function EditKpiPackModal({ open, onOpenChange, pack }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: kpiDefs } = useKpiDefinitions();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: '',
      profile: 'daf',
      kpiKeys: [],
      description: '',
    },
  });

  useEffect(() => {
    if (pack) {
      form.reset({
        label: pack.label,
        profile: pack.profile as 'daf' | 'dg' | 'controller' | 'manager' | 'analyst',
        kpiKeys: pack.kpiKeys,
        description: pack.description ?? '',
      });
    }
  }, [pack, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => kpiPacksApi.update(pack!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-packs'] });
      toast({ title: t('common.success'), description: t('kpiStore.packUpdateSuccess') });
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

  const activeKpis = kpiDefs?.filter((k) => k.isActive) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {t('kpiStore.editPack')} — <code className="text-sm">{pack?.name}</code>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('kpiStore.packLabel')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="profile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('kpiStore.packProfile')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daf">DAF</SelectItem>
                        <SelectItem value="dg">DG</SelectItem>
                        <SelectItem value="controller">Controller</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="analyst">Analyst</SelectItem>
                      </SelectContent>
                    </Select>
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

            <Controller
              control={form.control}
              name="kpiKeys"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t('kpiStore.packKpis')}</FormLabel>
                  <div className="grid grid-cols-2 gap-2 rounded-md border p-3 max-h-[300px] overflow-y-auto">
                    {activeKpis.map((kpi) => (
                      <div key={kpi.key} className="flex items-center gap-2">
                        <Checkbox
                          id={`edit-kpi-${kpi.key}`}
                          checked={field.value.includes(kpi.key)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, kpi.key]);
                            } else {
                              field.onChange(field.value.filter((k) => k !== kpi.key));
                            }
                          }}
                        />
                        <label htmlFor={`edit-kpi-${kpi.key}`} className="text-sm cursor-pointer">
                          {kpi.name}
                          <span className="ml-1 text-xs text-muted-foreground">({kpi.key})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  {fieldState.error && (
                    <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p>
                  )}
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
