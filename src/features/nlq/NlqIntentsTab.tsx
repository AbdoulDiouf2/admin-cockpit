import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { nlqApi } from '@/api';
import { Button } from '@/components/ui/button';
import { FilterBar } from '@/components/shared/FilterBar';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { EditNlqIntentModal } from './EditNlqIntentModal';

interface NlqIntent {
    id: string;
    key: string;
    label: string;
    category: string;
    keywords: string[];
    description?: string;
}

export function NlqIntentsTab() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [intents, setIntents] = useState<NlqIntent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [editTarget, setEditTarget] = useState<NlqIntent | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<NlqIntent | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchIntents = async () => {
        setIsLoading(true);
        try {
            const response = await nlqApi.getAllIntents();
            setIntents(response.data);
        } catch (error) {
            console.error('Failed to fetch intents:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchIntents(); }, []);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await nlqApi.deleteIntent(deleteTarget.id);
            toast({ title: 'Succès', description: 'Intent supprimé (templates associés supprimés).' });
            await fetchIntents();
        } catch (err: any) {
            toast({ title: 'Erreur', description: err.response?.data?.message || 'Erreur serveur', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };

    const categoryOptions = useMemo(() => {
        const cats = [...new Set(intents.map((i) => i.category).filter(Boolean))].sort();
        return cats.map((c) => ({ label: c, value: c }));
    }, [intents]);

    const filteredIntents = useMemo(() => {
        const q = search.toLowerCase();
        return intents.filter((i) => {
            if (filterCategory && i.category !== filterCategory) return false;
            if (q) return i.label.toLowerCase().includes(q) || i.key.toLowerCase().includes(q);
            return true;
        });
    }, [intents, search, filterCategory]);

    const hasActiveFilters = filterCategory !== '';
    const resetFilters = () => setFilterCategory('');

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('common.search') + '...'}
                        className="pl-9 h-8 max-w-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <FilterBar
                    filters={[{
                        key: 'category',
                        label: t('nlqStore.intentCategory'),
                        options: categoryOptions,
                        value: filterCategory,
                        onChange: setFilterCategory,
                    }]}
                    onReset={resetFilters}
                    hasActiveFilters={hasActiveFilters}
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('nlqStore.intentKey')}</TableHead>
                            <TableHead>{t('nlqStore.intentLabel')}</TableHead>
                            <TableHead>{t('nlqStore.intentCategory')}</TableHead>
                            <TableHead>{t('nlqStore.intentKeywords')}</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">{t('common.loading')}</TableCell>
                            </TableRow>
                        ) : filteredIntents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">{t('common.noData')}</TableCell>
                            </TableRow>
                        ) : (
                            filteredIntents.map((intent) => (
                                <TableRow key={intent.key}>
                                    <TableCell className="font-mono text-xs">{intent.key}</TableCell>
                                    <TableCell className="font-medium">
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto font-medium text-primary hover:underline justify-start"
                                            onClick={() => navigate(`/nlq-store/intents/${intent.id || intent.key}`)}
                                        >
                                            {intent.label}
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{intent.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {intent.keywords.map((kw, idx) => (
                                                <Badge key={idx} variant="secondary" className="text-[10px]">{kw}</Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigate(`/nlq-store/intents/${intent.id || intent.key}`)}>
                                                    <Eye className="h-4 w-4 mr-2" />{t('common.view')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setEditTarget(intent)}>
                                                    <Pencil className="h-4 w-4 mr-2" />Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => setDeleteTarget(intent)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <EditNlqIntentModal
                open={editTarget !== null}
                onOpenChange={(open) => { if (!open) setEditTarget(null); }}
                intent={editTarget}
                onSuccess={fetchIntents}
            />

            <ConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                title="Supprimer l'intent NLQ"
                description={`Supprimer "${deleteTarget?.key}" et tous ses templates SQL associés. Irréversible.`}
                onConfirm={handleDelete}
                isPending={isDeleting}
                confirmLabel="Supprimer"
                cancelLabel={t('common.cancel')}
            />
        </div>
    );
}
