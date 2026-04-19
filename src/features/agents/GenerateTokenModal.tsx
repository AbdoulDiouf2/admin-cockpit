import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { agentsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Copy, Key, Loader2 } from 'lucide-react';
import { useOrganizations } from '@/hooks/use-api';

const formSchema = z.object({
    organizationId: z.string().min(1, "L'organisation est requise"),
    name: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface GenerateTokenModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GenerateTokenModal({ open, onOpenChange }: GenerateTokenModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);
    const { data: organizations, isLoading: orgsLoading } = useOrganizations();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { organizationId: '', name: '' },
    });

    const handleClose = (open: boolean) => {
        if (!open) {
            setGeneratedToken(null);
            form.reset();
        }
        onOpenChange(open);
    };

    const mutation = useMutation({
        mutationFn: (values: FormValues) =>
            agentsApi.generateToken({ organizationId: values.organizationId, name: values.name }),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['agents-status'] });
            const token = (response.data as any)?.token || (response.data as any)?.agent_token;
            setGeneratedToken(token || 'Token généré (voir la réponse API)');
            toast({
                title: t('common.success'),
                description: t('agents.generateSuccess'),
            });
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description: error.response?.data?.message || 'Erreur lors de la génération du token',
                variant: 'destructive',
            });
        },
    });

    const handleCopy = () => {
        if (!generatedToken) return;
        navigator.clipboard.writeText(generatedToken);
        toast({ title: t('agents.tokenCopied') });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        {t('agents.generateTitle')}
                    </DialogTitle>
                    <DialogDescription>
                        {generatedToken
                            ? 'Copiez ce token et configurez votre agent.'
                            : 'Générez un token pour enregistrer un nouvel agent on-premise.'}
                    </DialogDescription>
                </DialogHeader>

                {generatedToken ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">{t('agents.newToken')}</p>
                            <div className="flex gap-2">
                                <Input
                                    value={generatedToken}
                                    readOnly
                                    className="font-mono text-xs"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleCopy}
                                    title={t('agents.copyToken')}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t('agents.tokenInstructions')}
                            </p>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => handleClose(false)}>Fermer</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
                            className="space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="organizationId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Organisation</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            disabled={orgsLoading}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner une organisation" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {organizations?.map((org) => (
                                                    <SelectItem key={org.id} value={org.id}>
                                                        {org.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('agents.agentNameOptional')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: Agent Siège Paris"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleClose(false)}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Générer
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
