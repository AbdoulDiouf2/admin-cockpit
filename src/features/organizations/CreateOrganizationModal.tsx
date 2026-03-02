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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { organizationsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    organizationName: z.string().min(2, 'Le nom de l\'organisation est requis'),
    adminEmail: z.string().email('Email invalide'),
    adminFirstName: z.string().min(2, 'Le prénom est requis'),
    adminLastName: z.string().min(2, 'Le nom est requis'),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateOrganizationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateOrganizationModal({
    open,
    onOpenChange,
}: CreateOrganizationModalProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            organizationName: '',
            adminEmail: '',
            adminFirstName: '',
            adminLastName: '',
        },
    });

    const mutation = useMutation({
        mutationFn: (values: FormValues) => organizationsApi.createClient(values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            toast({
                title: 'Succès',
                description: 'L\'organisation et son administrateur ont été créés.',
            });
            form.reset();
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({
                title: 'Erreur',
                description: error.response?.data?.message || 'Une erreur est survenue.',
                variant: 'destructive',
            });
        },
    });

    function onSubmit(values: FormValues) {
        mutation.mutate(values);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nouvelle Organisation</DialogTitle>
                    <DialogDescription>
                        Créez une nouvelle organisation client et son compte administrateur (DAF) racine.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="organizationName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom de l'organisation</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Ma Grosse Entreprise" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="adminFirstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prénom Admin</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Jean" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="adminLastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom Admin</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Dupont" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="adminEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Admin</FormLabel>
                                    <FormControl>
                                        <Input placeholder="jean.dupont@client.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Créer l'organisation
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
