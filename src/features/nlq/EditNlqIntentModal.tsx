import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
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
import { X, Loader2 } from 'lucide-react';
import { nlqApi } from '@/api';
import { useToast } from '@/hooks/use-toast';

const NLQ_CATEGORIES = ['finance', 'commercial', 'treasury'] as const;

const formSchema = z.object({
  label: z.string().min(1, 'Libellé requis'),
  description: z.string().optional(),
  category: z.enum(NLQ_CATEGORIES),
  keywords: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NlqIntent {
  id: string;
  key: string;
  label: string;
  description?: string;
  category: string;
  keywords?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent: NlqIntent | null;
  onSuccess: () => void;
}

function KeywordsInput({ value = [], onChange }: { value?: string[]; onChange: (v: string[]) => void }) {
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
          placeholder="chiffre affaires, revenus…"
          className="h-8"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>+</Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((kw) => (
            <Badge key={kw} variant="secondary" className="gap-1 text-xs">
              {kw}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onChange(value.filter((k) => k !== kw))} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function EditNlqIntentModal({ open, onOpenChange, intent, onSuccess }: Props) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { label: '', description: '', category: 'finance', keywords: [] },
  });

  useEffect(() => {
    if (intent) {
      form.reset({
        label: intent.label,
        description: intent.description ?? '',
        category: (NLQ_CATEGORIES.includes(intent.category as any) ? intent.category : 'finance') as typeof NLQ_CATEGORIES[number],
        keywords: intent.keywords ?? [],
      });
    }
  }, [intent, form]);

  const onSubmit = async (values: FormValues) => {
    if (!intent) return;
    setIsPending(true);
    try {
      await nlqApi.updateIntent(intent.id, values);
      toast({ title: 'Succès', description: 'Intent NLQ mis à jour.' });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.response?.data?.message || 'Erreur serveur', variant: 'destructive' });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            Modifier intent — <code className="text-sm">{intent?.key}</code>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="label" render={({ field }) => (
                <FormItem>
                  <FormLabel>Libellé</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
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

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="keywords" render={({ field }) => (
              <FormItem>
                <FormLabel>Mots-clés de détection</FormLabel>
                <FormControl>
                  <KeywordsInput value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
