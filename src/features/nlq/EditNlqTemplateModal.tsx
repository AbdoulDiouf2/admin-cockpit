import { useEffect, useState } from 'react';
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

const formSchema = z.object({
  sqlQuery: z.string().min(1, 'SQL requis'),
  defaultVizType: z.enum(VIZ_TYPES),
});

type FormValues = z.infer<typeof formSchema>;

interface NlqTemplate {
  id: string;
  intentKey: string;
  sageType: string;
  sqlQuery: string;
  defaultVizType: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: NlqTemplate | null;
  onSuccess: () => void;
}

export function EditNlqTemplateModal({ open, onOpenChange, template, onSuccess }: Props) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { sqlQuery: '', defaultVizType: 'card' },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        sqlQuery: template.sqlQuery,
        defaultVizType: (VIZ_TYPES.includes(template.defaultVizType as any) ? template.defaultVizType : 'card') as typeof VIZ_TYPES[number],
      });
    }
  }, [template, form]);

  const onSubmit = async (values: FormValues) => {
    if (!template) return;
    setIsPending(true);
    try {
      await nlqApi.updateTemplate(template.id, values);
      toast({ title: 'Succès', description: 'Template SQL mis à jour.' });
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
          <DialogTitle>
            Modifier template SQL —{' '}
            <code className="text-sm">{template?.intentKey}</code>
            {template && <span className="ml-2 text-muted-foreground text-sm">Sage {template.sageType}</span>}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="defaultVizType" render={({ field }) => (
              <FormItem className="w-48">
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

            <FormField control={form.control} name="sqlQuery" render={({ field }) => (
              <FormItem>
                <FormLabel>Requête SQL</FormLabel>
                <FormControl>
                  <Textarea
                    rows={10}
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
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
