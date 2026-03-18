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
import { Loader2, Search } from 'lucide-react';
import { useKpiDefinitions } from '@/hooks/use-api';
import { useState } from 'react';

const formSchema = z.object({
  name: z.string().min(1, 'Identifiant requis').regex(/^[a-z0-9_]+$/, 'Minuscules, chiffres et _ seulement'),
  label: z.string().min(1, 'Nom affiché requis'),
  profile: z.enum(['daf', 'dg', 'controller', 'manager', 'analyst']),
  kpiKeys: z.array(z.string()).min(1, 'Au moins un KPI requis'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateKpiPackModal({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: kpiDefs } = useKpiDefinitions();
  const [kpiSearch, setKpiSearch] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      label: '',
      profile: 'daf',
      kpiKeys: [],
      description: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => kpiPacksApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-packs'] });
      toast({ title: t('common.success'), description: t('kpiStore.packCreateSuccess') });
      form.reset();
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
  const filteredKpis = kpiSearch
    ? activeKpis.filter((k) =>
        k.name.toLowerCase().includes(kpiSearch.toLowerCase()) ||
        k.key.toLowerCase().includes(kpiSearch.toLowerCase())
      )
    : activeKpis;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{t('kpiStore.createPack')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('kpiStore.packName')}</FormLabel>
                    <FormControl>
                      <Input placeholder="pack_daf" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('kpiStore.packLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Pack DAF" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="profile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('kpiStore.packProfile')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </div>

            <Controller
              control={form.control}
              name="kpiKeys"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>{t('kpiStore.packKpis')}</FormLabel>
                  <div className="rounded-md border">
                    <div className="relative border-b p-2">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder={t('common.search') + '...'}
                        value={kpiSearch}
                        onChange={(e) => setKpiSearch(e.target.value)}
                        className="pl-8 h-7 text-sm border-none focus-visible:ring-0 bg-transparent"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-3 max-h-[280px] overflow-y-auto">
                    {filteredKpis.map((kpi) => (
                      <div key={kpi.key} className="flex items-center gap-2">
                        <Checkbox
                          id={`kpi-${kpi.key}`}
                          checked={field.value.includes(kpi.key)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, kpi.key]);
                            } else {
                              field.onChange(field.value.filter((k) => k !== kpi.key));
                            }
                          }}
                        />
                        <label htmlFor={`kpi-${kpi.key}`} className="text-sm cursor-pointer">
                          {kpi.name}
                          <span className="ml-1 text-xs text-muted-foreground">({kpi.key})</span>
                        </label>
                      </div>
                    ))}
                    {filteredKpis.length === 0 && (
                      <p className="text-sm text-muted-foreground col-span-2 py-2">
                        {kpiSearch ? t('common.noData') : 'Aucun KPI actif disponible'}
                      </p>
                    )}
                    </div>
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
                {t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
