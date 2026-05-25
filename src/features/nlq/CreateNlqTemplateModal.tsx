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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { nlqApi } from '@/api';
import { useToast } from '@/hooks/use-toast';

const VIZ_TYPES = ['card', 'gauge', 'bar', 'line', 'table', 'pie', 'map', 'text'] as const;
const SAGE_TYPES = ['100', 'X3'] as const;

const formSchema = z.object({
  intentKey: z.string().min(1, 'Intent requis'),
  sageType: z.enum(SAGE_TYPES),
  sqlQuery: z.string().min(1, 'SQL requis'),
  defaultVizType: z.enum(VIZ_TYPES),
});

type FormValues = z.infer<typeof formSchema>;

interface NlqIntent {
  id: string;
  key: string;
  label: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateNlqTemplateModal({ open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [intents, setIntents] = useState<NlqIntent[]>([]);

  useEffect(() => {
    if (open) {
      nlqApi.getAllIntents().then((res) => setIntents(res.data)).catch(() => {});
    }
  }, [open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { intentKey: '', sageType: '100', sqlQuery: '', defaultVizType: 'card' },
  });

  const onSubmit = async (values: FormValues) => {
    setIsPending(true);
    try {
      await nlqApi.createTemplate(values);
      toast({ title: 'Succès', description: 'Template SQL créé.' });
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
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Créer un template SQL NLQ</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="intentKey" render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>Intent associé</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner…" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {intents.map((i) => (
                        <SelectItem key={i.key} value={i.key}>
                          <span className="font-mono text-xs">{i.key}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="sageType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type Sage</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="100">Sage 100</SelectItem>
                      <SelectItem value="X3">Sage X3</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="defaultVizType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Visualisation</FormLabel>
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

            <FormField control={form.control} name="sqlQuery" render={({ field }) => (
              <FormItem>
                <FormLabel>Requête SQL</FormLabel>
                <FormControl>
                  <Textarea
                    rows={8}
                    placeholder="SELECT SUM(ca_ht) AS current, ... FROM VW_FINANCE_GENERAL"
                    className="font-mono text-xs"
                    {...field}
                  />
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
