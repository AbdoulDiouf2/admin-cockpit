import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { kpiDefinitionsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const VIZ_TYPES = ['card', 'gauge', 'bar', 'line', 'table', 'pie', 'map', 'text'] as const;
const NLQ_CATEGORIES = ['finance', 'commercial', 'treasury'] as const;

const STEPS = [
  { id: 1, label: 'Général' },
  { id: 2, label: 'Technique' },
  { id: 3, label: 'Contexte' },
  { id: 4, label: 'Intent NLQ' },
  { id: 5, label: 'Template SQL' },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const formSchema = z.object({
  // Étape 1 — Général
  key: z.string().min(1, 'Clé requise').regex(/^[a-z0-9_]+$/, 'Minuscules, chiffres et _ seulement'),
  name: z.string().min(1, 'Nom requis'),
  code: z.string().optional(),
  domain: z.string().optional(),
  description: z.string().optional(),
  category: z.string().min(1, 'Catégorie requise'),
  subcategory: z.string().optional(),
  unit: z.string().optional(),
  defaultVizType: z.enum(VIZ_TYPES),
  // Étape 2 — Technique
  direction: z.enum(['HIGHER_IS_BETTER', 'LOWER_IS_BETTER']).optional(),
  sqlSage100View: z.string().optional(),
  sqlSage100Tables: z.array(z.string()).optional(),
  mlUsage: z.string().optional(),
  // Étape 3 — Contexte
  usage: z.string().optional(),
  frequency: z.string().optional(),
  risk: z.string().optional(),
  profiles: z.array(z.string()).optional(),
  sectors: z.array(z.string()).optional(),
  // Étape 4 — Intent NLQ
  intentLabel: z.string().optional(),
  intentDescription: z.string().optional(),
  intentCategory: z.enum(NLQ_CATEGORIES).optional(),
  intentKeywords: z.array(z.string()).optional(),
  // Étape 5 — Template SQL
  sqlSage100: z.string().optional(),
  sqlSageX3: z.string().optional(),
  templateVizType: z.enum(VIZ_TYPES).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Sub-components ───────────────────────────────────────────────────────────

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
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} className="h-8"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
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

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center gap-1">
          <div className={cn(
            'flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium transition-colors',
            current === step.id && 'bg-primary text-primary-foreground',
            current > step.id && 'bg-primary/20 text-primary',
            current < step.id && 'bg-muted text-muted-foreground',
          )}>
            {current > step.id ? <Check className="h-3.5 w-3.5" /> : step.id}
          </div>
          <span className={cn(
            'text-xs hidden sm:block',
            current === step.id ? 'text-foreground font-medium' : 'text-muted-foreground',
          )}>
            {step.label}
          </span>
          {idx < STEPS.length - 1 && <div className="h-px w-4 bg-border mx-1" />}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateKpiWizard({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      key: '', name: '', code: '', domain: '', description: '',
      category: '', subcategory: '', unit: '', defaultVizType: 'card',
      direction: 'HIGHER_IS_BETTER', sqlSage100View: '', mlUsage: '',
      sqlSage100Tables: [],
      usage: '', frequency: '', risk: '',
      profiles: [], sectors: [],
      intentLabel: '', intentDescription: '', intentCategory: 'finance',
      intentKeywords: [],
      sqlSage100: '', sqlSageX3: '', templateVizType: 'card',
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => kpiDefinitionsApi.createFull(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-definitions'] });
      toast({ title: 'Succès', description: 'KPI créé avec intent et templates.' });
      form.reset();
      setStep(1);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur serveur',
        variant: 'destructive',
      });
    },
  });

  // Validate only fields for the current step before advancing
  const STEP_FIELDS: Record<number, (keyof FormValues)[]> = {
    1: ['key', 'name', 'category', 'defaultVizType'],
    2: [],
    3: [],
    4: [],
    5: [],
  };

  const handleNext = async () => {
    const fields = STEP_FIELDS[step];
    if (fields.length > 0) {
      const valid = await form.trigger(fields);
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, 5));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleClose = () => {
    form.reset();
    setStep(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau KPI</DialogTitle>
        </DialogHeader>

        <StepIndicator current={step} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">

            {/* ── Étape 1 — Général ── */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="key" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clé unique <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="f01_ca_ht" {...field} /></FormControl>
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
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input placeholder="Chiffre d'Affaires HT" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
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
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie <span className="text-destructive">*</span></FormLabel>
                      <FormControl><Input placeholder="finance, stock…" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="unit" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unité</FormLabel>
                      <FormControl><Input placeholder="€, %, jours" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="defaultVizType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visualisation <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {VIZ_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </>
            )}

            {/* ── Étape 2 — Technique ── */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="direction" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Direction performance</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
                    <FormControl><Textarea rows={3} placeholder="Feature pour forecasting…" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}

            {/* ── Étape 3 — Contexte ── */}
            {step === 3 && (
              <>
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
                        <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger></FormControl>
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
              </>
            )}

            {/* ── Étape 4 — Intent NLQ ── */}
            {step === 4 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Clé intent = <code className="text-xs bg-muted px-1 rounded">{form.watch('key')}</code> (même que le KPI).
                  Laisser vide pour ne pas créer d'intent maintenant.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="intentLabel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Libellé intent</FormLabel>
                      <FormControl><Input placeholder="Chiffre d'Affaires HT" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="intentCategory" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie NLQ</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {NLQ_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="intentDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description intent</FormLabel>
                    <FormControl><Textarea rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="intentKeywords" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mots-clés de détection</FormLabel>
                    <FormControl>
                      <TagInput value={field.value} onChange={field.onChange} placeholder="ca, chiffre affaires, revenus…" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}

            {/* ── Étape 5 — Template SQL ── */}
            {step === 5 && (
              <>
                <p className="text-sm text-muted-foreground">
                  Laisser vide pour ne pas créer de template. Nécessite un intent (étape 4).
                </p>
                <FormField control={form.control} name="templateVizType" render={({ field }) => (
                  <FormItem className="w-48">
                    <FormLabel>Visualisation templates</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {VIZ_TYPES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sqlSage100" render={({ field }) => (
                  <FormItem>
                    <FormLabel>SQL Sage 100</FormLabel>
                    <FormControl>
                      <Textarea rows={6} className="font-mono text-xs"
                        placeholder="SELECT SUM(ca_ht) AS current FROM VW_FINANCE_GENERAL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sqlSageX3" render={({ field }) => (
                  <FormItem>
                    <FormLabel>SQL Sage X3</FormLabel>
                    <FormControl>
                      <Textarea rows={6} className="font-mono text-xs"
                        placeholder="SELECT SUM(AMTATI) FROM SINVOICED WHERE..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}

            {/* ── Navigation ── */}
            <div key={step} className="flex justify-between pt-4 border-t">
              <Button type="button" variant="outline" onClick={step === 1 ? handleClose : handleBack}>
                {step === 1 ? 'Annuler' : <><ChevronLeft className="h-4 w-4 mr-1" />Précédent</>}
              </Button>
              {step < 5 ? (
                <Button type="button" onClick={handleNext}>
                  Suivant <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Check className="h-4 w-4 mr-1" />
                  Créer le KPI
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
