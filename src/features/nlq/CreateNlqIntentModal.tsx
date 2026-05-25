import { useState } from 'react';
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
  key: z.string().min(1, 'Clé requise').regex(/^[a-z0-9_]+$/, 'Minuscules, chiffres et _ seulement'),
  label: z.string().min(1, 'Libellé requis'),
  description: z.string().optional(),
  category: z.enum(NLQ_CATEGORIES),
  keywords: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CreateNlqIntentModal({ open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { key: '', label: '', description: '', category: 'finance', keywords: [] },
  });

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    try {
      await nlqApi.createIntent(values);
      toast({ title: 'Succès', description: 'Intent NLQ créé.' });
      form.reset();
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
          <DialogTitle>Créer un intent NLQ</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="key" render={({ field }) => (
                <FormItem>
                  <FormLabel>Clé unique</FormLabel>
                  <FormControl><Input placeholder="f01_ca_ht" {...field} /></FormControl>
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

            <FormField control={form.control} name="label" render={({ field }) => (
              <FormItem>
                <FormLabel>Libellé</FormLabel>
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
                Créer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
