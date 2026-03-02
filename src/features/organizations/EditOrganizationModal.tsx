import { useEffect } from 'react';
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
import { organizationsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import type { Organization } from '@/types';

const formSchema = z.object({
    name: z.string().min(2, 'Le nom est requis'),
    size: z.string().optional(),
    plan: z.string().optional(),
    sageType: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditOrganizationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organization: Organization | null;
}

export function EditOrganizationModal({
    open,
    onOpenChange,
    organization,
}: EditOrganizationModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', size: '', plan: '', sageType: '' },
    });

    useEffect(() => {
        if (organization) {
            form.reset({
                name: organization.name,
                size: organization.size || '',
                plan: organization.plan || '',
                sageType: organization.sageType || '',
            });
        }
    }, [organization, form]);

    const mutation = useMutation({
        mutationFn: (values: FormValues) =>
            organizationsApi.update(organization!.id, values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            toast({
                title: t('common.success'),
                description: t('organizations.editSuccess'),
            });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description:
                    error.response?.data?.message || t('organizations.editError'),
                variant: 'destructive',
            });
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{t('organizations.editOrg')}</DialogTitle>
                    <DialogDescription>{organization?.name}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('organizations.name')}</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="size"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('organizations.size')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="—" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="TPE">TPE</SelectItem>
                                                <SelectItem value="PME">PME</SelectItem>
                                                <SelectItem value="ETI">ETI</SelectItem>
                                                <SelectItem value="GE">GE</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="plan"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('organizations.plan')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="—" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="starter">Starter</SelectItem>
                                                <SelectItem value="pro">Pro</SelectItem>
                                                <SelectItem value="enterprise">Enterprise</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="sageType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('organizations.sageType')}</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="—" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="sage100">Sage 100</SelectItem>
                                            <SelectItem value="sageligne100">Sage Ligne 100</SelectItem>
                                            <SelectItem value="sagedsp">Sage DSP</SelectItem>
                                            <SelectItem value="other">Autre</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                {t('common.cancel')}
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {t('common.save')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
