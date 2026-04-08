import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  FileText, 
  Building2,
  AlertTriangle,
  Image as ImageIcon,
  X,
  Terminal,
  Send,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { bugTrackerApi } from './services/bugTrackerApi';
import { organizationsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';

const bugSchema = z.object({
  title: z.string().min(10, 'Le titre doit faire au moins 10 caractères').max(120),
  bug_type: z.array(z.string()).min(1, 'Sélectionnez au moins un type'),
  module: z.string().min(1, 'Sélectionnez un module'),
  priority: z.string(),
  organizationId: z.string().optional(),
  entity_code: z.string().optional(),
  fiscal_year: z.coerce.number().optional(),
  description: z.string().min(30, 'La description doit faire au moins 30 caractères'),
  steps_to_reproduce: z.array(z.object({ value: z.string() })),
  expected_behavior: z.string().optional(),
  actual_behavior: z.string().optional(),
  frequency: z.string(),
  impact: z.string(),
  url: z.string().url('URL invalide'),
  browser: z.string(),
  os: z.string(),
  screen: z.string(),
  console_errors: z.string().optional(),
  notify_emails: z.string().optional(),
});

type BugFormValues = z.infer<typeof bugSchema>;

const BUG_TYPES = [
  { id: 'affichage', label: 'Affichage / UI' },
  { id: 'calcul', label: 'Calcul / Données Erronées' },
  { id: 'bloquant', label: 'Bloquant / Crash' },
  { id: 'performance', label: 'Performance / Lenteur' },
  { id: 'securite', label: 'Sécurité' },
  { id: 'traduction', label: 'Traduction / Libellé' },
  { id: 'autre', label: 'Non spécifié / Autre' },
];

const MODULES = [
  { id: 'none', label: 'Non spécifié' },
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'kpi_store', label: 'KPI Store' },
  { id: 'nlq', label: 'Assistant IA (NLQ)' },
  { id: 'agents', label: 'Agents & Synchro' },
  { id: 'admin', label: 'Administration' },
  { id: 'auth', label: 'Connexion / Profil' },
];

export function CreateBugPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: orgs, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationsApi.getAll().then(res => res.data),
  });

  const form = useForm<BugFormValues>({
    resolver: zodResolver(bugSchema),
    defaultValues: {
      title: '',
      bug_type: [],
      module: '',
      priority: 'moyenne',
      organizationId: '',
      entity_code: '',
      fiscal_year: new Date().getFullYear(),
      description: '',
      steps_to_reproduce: [{ value: '' }],
      expected_behavior: '',
      actual_behavior: '',
      frequency: 'toujours',
      impact: 'moyenne',
      url: window.location.href,
      browser: navigator.userAgent,
      os: navigator.platform,
      screen: `${window.screen.width}x${window.screen.height}`,
      console_errors: '',
      notify_emails: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'steps_to_reproduce',
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFiles(Array.from(files));
    }
  };

  const processFiles = async (files: File[]) => {
    setIsUploading(true);
    try {
      const uploadPromises = files.map(file => bugTrackerApi.uploadAttachment(file));
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map(r => r.url);
      setAttachments(prev => [...prev, ...newUrls]);
    } catch (error) {
      toast({ title: 'Erreur', description: 'Échec de l\'upload', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(Array.from(files));
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: (values: BugFormValues) => {
      const payload = {
        ...values,
        organizationId: (values.organizationId === 'none' || !values.organizationId) ? undefined : values.organizationId,
        steps_to_reproduce: values.steps_to_reproduce.map(s => s.value).filter(Boolean),
        notify_emails: values.notify_emails ? values.notify_emails.split(',').map(e => e.trim()) : [],
        attachments: attachments,
      };
      return bugTrackerApi.createBug(payload as any);
    },
    onSuccess: () => {
      toast({ title: 'Signalement créé', description: 'Le bug a été enregistré.' });
      navigate('/bug-tracker');
    },
    onError: (error: any) => {
      toast({ title: 'Erreur', description: error.response?.data?.message || 'Erreur API', variant: 'destructive' });
    }
  });

  return (
    <div className="w-full space-y-8 pb-20 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/bug-tracker')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight">Nouveau Signalement</h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          Remplissez tous les champs pour créer un ticket technique précis.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(v => mutation.mutate(v))} className="space-y-8">
          
          {/* IDENTIFICATION */}
          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Identification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre court et explicite</FormLabel>
                    <FormControl><Input placeholder="Ex: Crash lors de l'export" {...field} className="text-lg" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bug_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type de bug</FormLabel>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-xl bg-muted/20">
                      {BUG_TYPES.map((type) => (
                        <div key={type.id} className="flex items-center space-x-2 bg-background border px-3 py-1.5 rounded-full hover:border-primary transition-colors cursor-pointer">
                           <Checkbox
                              id={type.id}
                              checked={field.value?.includes(type.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, type.id])
                                  : field.onChange(field.value?.filter((value) => value !== type.id));
                              }}
                            />
                            <label htmlFor={type.id} className="text-sm cursor-pointer">{type.label}</label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* CONTEXTE CLIENT */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Contexte Business
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client / Organisation</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingOrgs}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Choisir un client" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">Non spécifié / Global</SelectItem>
                        {orgs?.map(org => (<SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="module"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Module concerné</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Choisir un module" /></SelectTrigger></FormControl>
                      <SelectContent>{MODULES.map(m => (<SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>))}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="entity_code"
                render={({ field }) => (
                  <FormItem><FormLabel>Code Dossier</FormLabel><FormControl><Input placeholder="Ex: SAGE_001" {...field} /></FormControl><FormMessage /></FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fiscal_year"
                render={({ field }) => (
                  <FormItem><FormLabel>Exercice</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* ANALYSE TECHNIQUE */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" /> Analyse & Reproduction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sévérité</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="critique">🔴 Critique</SelectItem>
                            <SelectItem value="haute">🟠 Haute</SelectItem>
                            <SelectItem value="moyenne">🟡 Moyenne</SelectItem>
                            <SelectItem value="basse">🟢 Basse</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="impact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impact Métier</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="none">⏺️ Non spécifié</SelectItem>
                            <SelectItem value="production_bloquee">🚫 Bloqué</SelectItem>
                            <SelectItem value="travail_degrade">📉 Dégradé</SelectItem>
                            <SelectItem value="moyenne">⏺️ Modéré</SelectItem>
                            <SelectItem value="faible">faible</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
               </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description détaillée</FormLabel>
                    <FormControl><Textarea className="min-h-[120px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <FormLabel>Étapes pour reproduire</FormLabel>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <div className="flex-none w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold mt-2">{index + 1}</div>
                    <FormField
                      control={form.control}
                      name={`steps_to_reproduce.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl><Input {...field} /></FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '' })} className="mt-1">
                  <Plus className="h-4 w-4 mr-2" /> Ajouter une étape
                </Button>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expected_behavior"
                    render={({ field }) => (
                      <FormItem><FormLabel>Résultat attendu</FormLabel><FormControl><Textarea {...field} className="h-20" /></FormControl></FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="actual_behavior"
                    render={({ field }) => (
                      <FormItem><FormLabel>Résultat observé</FormLabel><FormControl><Textarea {...field} className="h-20" /></FormControl></FormItem>
                    )}
                  />
               </div>
            </CardContent>
          </Card>

          {/* PIECES JOINTES */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" /> Pièces Jointes & Preuves
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/30 border-muted-foreground/20 hover:border-primary transition-all cursor-pointer group relative"
              >
                {isUploading && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-xl">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                <Plus className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                <p className="font-medium">Cliquez ou glissez vos captures ici</p>
                <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {attachments.map((url, i) => (
                    <div key={i} className="group relative aspect-square rounded-lg overflow-hidden border">
                      <img src={url} alt={`Upload ${i}`} className="object-cover w-full h-full" />
                      <Button type="button" variant="destructive" size="icon" onClick={() => removeAttachment(i)} className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* DEBUG & NOTIFS */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-red-500" /> Debug & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <FormField
                  control={form.control}
                  name="console_errors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between">Logs Console <span className="text-[10px] text-muted-foreground">(Optionnel)</span></FormLabel>
                      <FormControl><Textarea className="font-mono text-xs min-h-[100px] bg-slate-900 text-red-400" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notify_emails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emails à notifier</FormLabel>
                      <FormControl><Input placeholder="dev@society.com..." {...field} /></FormControl>
                      <FormDescription>Séparez les emails par des virgules.</FormDescription>
                    </FormItem>
                  )}
                />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4 pt-4">
            <Button type="button" variant="ghost" onClick={() => navigate('/bug-tracker')} disabled={mutation.isPending}>
              Annuler
            </Button>
            <Button type="submit" size="lg" className="px-12 font-bold" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Créer le ticket
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
