import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
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
  isActive: z.boolean().optional(),
  // Champs techniques
  usage: z.string().optional(),
  frequency: z.string().optional(),
  risk: z.string().optional(),
  profiles: z.array(z.string()).optional(),
  sectors: z.array(z.string()).optional(),
  sqlSage100View: z.string().optional(),
  sqlSage100Tables: z.array(z.string()).optional(),
  direction: z.enum(['HIGHER_IS_BETTER', 'LOWER_IS_BETTER']).optional(),
  mlUsage: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kpi: KpiDefinition | null;
}

function TagInput({
  value = [],
  onChange,
  placeholder,
}: {
  value?: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const tag = input.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInput('');
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="h-8"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>+</Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 text-xs">
              {tag}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onChange(value.filter((t) => t !== tag))} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditKpiDefinitionModal({ open, onOpenChange, kpi }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '', code: '', domain: '', description: '', category: '',
      subcategory: '', unit: '', defaultVizType: 'bar', isActive: true,
      usage: '', frequency: '', risk: '', mlUsage: '', sqlSage100View: '',
      profiles: [], sectors: [], sqlSage100Tables: [],
      direction: 'HIGHER_IS_BETTER',
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
        defaultVizType: (VIZ_TYPES.includes(kpi.defaultVizType as any) ? kpi.defaultVizType : 'bar') as typeof VIZ_TYPES[number],
        isActive: kpi.isActive ?? true,
        usage: (kpi as any).usage ?? '',
        frequency: (kpi as any).frequency ?? '',
        risk: (kpi as any).risk ?? '',
        mlUsage: (kpi as any).mlUsage ?? '',
        sqlSage100View: (kpi as any).sqlSage100View ?? '',
        profiles: (kpi as any).profiles ?? [],
        sectors: (kpi as any).sectors ?? [],
        sqlSage100Tables: (kpi as any).sqlSage100Tables ?? [],
        direction: ((kpi as any).direction ?? 'HIGHER_IS_BETTER') as 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER',
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('kpiStore.editKpi')} — <code className="text-sm">{kpi?.key}</code>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <Tabs defaultValue="general">
              <TabsList className="mb-4">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="technique">Technique</TabsTrigger>
                <TabsTrigger value="contexte">Contexte</TabsTrigger>
              </TabsList>

              {/* ── Onglet Général ── */}
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('kpiStore.kpiName')}</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="code" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl><Input placeholder="KPI-F01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('roles.description')}</FormLabel>
                    <FormControl><Textarea rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="domain" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domaine</FormLabel>
                      <FormControl><Input placeholder="Finance & Trésorerie" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="subcategory" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sous-catégorie</FormLabel>
                      <FormControl><Input placeholder="Revenus" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="unit" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('kpiStore.kpiUnit')}</FormLabel>
                      <FormControl><Input placeholder="€, %, jours" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('kpiStore.kpiCategory')}</FormLabel>
                      <FormControl><Input placeholder="finance, stock, client…" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="defaultVizType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('kpiStore.kpiVizType')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VIZ_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center gap-3">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">KPI actif</FormLabel>
                  </FormItem>
                )} />
              </TabsContent>

              {/* ── Onglet Technique ── */}
              <TabsContent value="technique" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="direction" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Direction performance</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="HIGHER_IS_BETTER">Hausse = bon</SelectItem>
                          <SelectItem value="LOWER_IS_BETTER">Baisse = bon</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="sqlSage100View" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vue Sage 100</FormLabel>
                      <FormControl><Input placeholder="VW_FINANCE_GENERAL" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="sqlSage100Tables" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tables Sage 100</FormLabel>
                    <FormControl>
                      <TagInput value={field.value} onChange={field.onChange} placeholder="G_ECRITUREC, F_PIECE…" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="mlUsage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage ML / IA</FormLabel>
                    <FormControl><Textarea rows={3} placeholder="Feature pour forecasting, clustering…" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </TabsContent>

              {/* ── Onglet Contexte ── */}
              <TabsContent value="contexte" className="space-y-4">
                <FormField control={form.control} name="usage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage métier</FormLabel>
                    <FormControl><Textarea rows={2} placeholder="Pilotage performance commerciale…" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="frequency" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fréquence</FormLabel>
                      <FormControl><Input placeholder="Mensuel, Annuel, Quotidien" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="risk" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Niveau de risque</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Faible">Faible</SelectItem>
                          <SelectItem value="Moyen">Moyen</SelectItem>
                          <SelectItem value="Élevé">Élevé</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="profiles" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profils cibles</FormLabel>
                    <FormControl>
                      <TagInput value={field.value} onChange={field.onChange} placeholder="DAF, CFO, Contrôleur…" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="sectors" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secteurs applicables</FormLabel>
                    <FormControl>
                      <TagInput value={field.value} onChange={field.onChange} placeholder="Distribution, Industrie…" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </TabsContent>
            </Tabs>

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
