import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { agentsApi } from '@/api';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Copy, Loader2, RefreshCw } from 'lucide-react';
import type { Agent } from '@/types';

interface RegenerateTokenModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    agent: Agent | null;
}

export function RegenerateTokenModal({
    open,
    onOpenChange,
    agent,
}: RegenerateTokenModalProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [newToken, setNewToken] = useState<string | null>(null);

    const handleClose = (open: boolean) => {
        if (!open) {
            setNewToken(null);
        }
        onOpenChange(open);
    };

    const mutation = useMutation({
        mutationFn: () => agentsApi.regenerateToken(agent!.id),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['agents-status'] });
            const token =
                (response.data as any)?.token ||
                (response.data as any)?.agent_token;
            setNewToken(token || 'Token régénéré (voir la réponse API)');
            toast({
                title: t('common.success'),
                description: t('agents.regenerateSuccess'),
            });
        },
        onError: (error: any) => {
            toast({
                title: t('common.error'),
                description:
                    error.response?.data?.message ||
                    'Erreur lors de la régénération du token',
                variant: 'destructive',
            });
        },
    });

    const handleCopy = () => {
        if (!newToken) return;
        navigator.clipboard.writeText(newToken);
        toast({ title: t('agents.tokenCopied') });
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5" />
                        {t('agents.confirmRegenerateTitle')}
                    </DialogTitle>
                    <DialogDescription>
                        Agent : <strong>{agent?.name}</strong>
                    </DialogDescription>
                </DialogHeader>

                {newToken ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">{t('agents.newToken')}</p>
                            <div className="flex gap-2">
                                <Input
                                    value={newToken}
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
                    <div className="space-y-4">
                        <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
                            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                                {t('agents.confirmRegenerateDesc')}
                            </p>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleClose(false)}
                                disabled={mutation.isPending}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => mutation.mutate()}
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Regénérer
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
