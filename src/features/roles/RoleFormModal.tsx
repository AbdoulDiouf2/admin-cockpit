import { useEffect, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { rolesApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useRolePermissions } from '@/hooks/use-api';
import type { Role, Permission } from '@/types';

const formSchema = z.object({
    name: z.string().min(2, 'Le nom du rôle est requis'),
    description: z.string().optional(),
    permissionIds: z
        .array(z.string())
        .min(1, 'Au moins une permission est requise'),
});

type FormValues = z.infer<typeof formSchema>;

interface RoleFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    role?: Role | null;
}

export function RoleFormModal({ open, onOpenChange, role }: RoleFormModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { data: permissions, isLoading: permissionsLoading } = useRolePermissions();

    const isEditMode = !!role;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            permissionIds: [],
        },
    });

    useEffect(() => {
        if (open) {
            if (role) {
                form.reset({
                    name: role.name,
                    description: role.description || '',
                    permissionIds:
                        role.permissions?.map((rp) => rp.permissionId) || [],
                });
            } else {
                form.reset({ name: '', description: '', permissionIds: [] });
            }
        }
    }, [open, role, form]);

    // Group permissions by resource
    const groupedPermissions = useMemo(() => {
        return (permissions || []).reduce(
            (acc, perm) => {
                if (!acc[perm.resource]) acc[perm.resource] = [];
                acc[perm.resource].push(perm);
                return acc;
            },
            {} as Record<string, Permission[]>
        );
    }, [permissions]);

    const mutation = useMutation({
        mutationFn: (values: FormValues) => {
            if (isEditMode) {
                return rolesApi.update(role!.id, {
                    name: values.name,
                    description: values.description,
                    permissionIds: values.permissionIds,
                } as any);
            }
            return rolesApi.create({
                name: values.name,
                description: values.description,
                permissionIds: values.permissionIds,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast({
                title: t('common.success'),
                description: isEditMode
                    ? t('roles.editSuccess')
                    : t('roles.createSuccess'),
            });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description:
                    error.response?.data?.message ||
                    (isEditMode ? t('roles.editError') : t('roles.createError')),
                variant: 'destructive',
            });
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditMode ? t('roles.editRole') : t('roles.createRole')}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? `Modifier le rôle "${role?.name}"`
                            : 'Créer un nouveau rôle personnalisé avec ses permissions'}
                    </DialogDescription>
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
                                    <FormLabel>{t('roles.roleName')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Analyste financier"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('roles.description')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Description du rôle (optionnel)"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="permissionIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('roles.selectPermissions')}</FormLabel>
                                    <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-4">
                                        {permissionsLoading ? (
                                            <div className="flex justify-center py-4">
                                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : Object.keys(groupedPermissions).length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                Aucune permission disponible
                                            </p>
                                        ) : (
                                            Object.entries(groupedPermissions).map(
                                                ([resource, perms]) => (
                                                    <div key={resource}>
                                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                                            {resource}
                                                        </p>
                                                        <div className="space-y-2">
                                                            {perms.map((perm) => (
                                                                <label
                                                                    key={perm.id}
                                                                    className="flex items-center gap-2 cursor-pointer group"
                                                                >
                                                                    <Checkbox
                                                                        checked={field.value.includes(
                                                                            perm.id
                                                                        )}
                                                                        onCheckedChange={(
                                                                            checked
                                                                        ) => {
                                                                            if (checked) {
                                                                                field.onChange([
                                                                                    ...field.value,
                                                                                    perm.id,
                                                                                ]);
                                                                            } else {
                                                                                field.onChange(
                                                                                    field.value.filter(
                                                                                        (id) =>
                                                                                            id !==
                                                                                            perm.id
                                                                                    )
                                                                                );
                                                                            }
                                                                        }}
                                                                    />
                                                                    <span className="text-sm group-hover:text-foreground">
                                                                        {perm.action}
                                                                        {perm.description && (
                                                                            <span className="text-xs text-muted-foreground ml-2">
                                                                                — {perm.description}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            )
                                        )}
                                    </div>
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
                                {isEditMode ? t('common.save') : t('roles.createRole')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
