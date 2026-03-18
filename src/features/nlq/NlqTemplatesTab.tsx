import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { nlqApi } from '@/api';
import { Input } from '@/components/ui/input';
import { Search, MoreHorizontal, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FilterBar } from '@/components/shared/FilterBar';
import { useToast } from '@/hooks/use-toast';

interface NlqTemplate {
    id: string;
    intentKey: string;
    sageType: string;
    sqlQuery: string;
    defaultVizType: string;
    active?: boolean;
    isActive?: boolean;
    intent?: { label: string };
}

export function NlqTemplatesTab() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [templates, setTemplates] = useState<NlqTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSageType, setFilterSageType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [toggleTarget, setToggleTarget] = useState<NlqTemplate | null>(null);
    const [isToggling, setIsToggling] = useState(false);

    const fetchTemplates = async () => {
        try {
            const response = await nlqApi.getAllTemplates();
            setTemplates(response.data);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleToggle = async () => {
        if (!toggleTarget) return;
        setIsToggling(true);
        try {
            await nlqApi.toggleTemplate(toggleTarget.id);
            toast({ title: t('common.success'), description: t('nlqStore.templateToggleSuccess') });
            await fetchTemplates();
        } catch (error: any) {
            toast({
                title: t('common.error'),
                description: error.response?.data?.message || t('common.error'),
                variant: 'destructive',
            });
        } finally {
            setIsToggling(false);
            setToggleTarget(null);
        }
    };

    const isActive = (tpl: NlqTemplate) => tpl.isActive ?? tpl.active ?? true;

    const filteredTemplates = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return templates.filter((tpl) => {
            if (filterSageType && tpl.sageType !== filterSageType) return false;
            if (filterStatus === 'true' && !isActive(tpl)) return false;
            if (filterStatus === 'false' && isActive(tpl)) return false;
            if (query) {
                return (
                    tpl.intentKey.toLowerCase().includes(query) ||
                    (tpl.sqlQuery && tpl.sqlQuery.toLowerCase().includes(query)) ||
                    (tpl.sageType && tpl.sageType.toLowerCase().includes(query))
                );
            }
            return true;
        });
    }, [templates, searchQuery, filterSageType, filterStatus]);

    const hasActiveFilters = filterSageType !== '' || filterStatus !== '';
    const resetFilters = () => { setFilterSageType(''); setFilterStatus(''); };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('common.search') + "..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-8 max-w-sm"
                    />
                </div>
                <FilterBar
                    filters={[
                        {
                            key: 'sageType',
                            label: t('nlqStore.templateSageType'),
                            options: [
                                { label: 'Sage 100', value: '100' },
                                { label: 'Sage X3', value: 'X3' },
                            ],
                            value: filterSageType,
                            onChange: setFilterSageType,
                        },
                        {
                            key: 'status',
                            label: t('common.status'),
                            options: [
                                { label: t('nlqStore.active'), value: 'true' },
                                { label: t('nlqStore.inactive'), value: 'false' },
                            ],
                            value: filterStatus,
                            onChange: setFilterStatus,
                        },
                    ]}
                    onReset={resetFilters}
                    hasActiveFilters={hasActiveFilters}
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('nlqStore.templateIntent')}</TableHead>
                            <TableHead>{t('nlqStore.templateSageType')}</TableHead>
                            <TableHead>{t('nlqStore.templateVizType')}</TableHead>
                            <TableHead>{t('nlqStore.templateQuery')}</TableHead>
                            <TableHead>{t('common.status')}</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    {t('common.loading')}
                                </TableCell>
                            </TableRow>
                        ) : filteredTemplates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    {t('common.noData')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTemplates.map((tpl) => (
                                <TableRow key={tpl.id}>
                                    <TableCell className="font-mono text-xs">
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto font-mono text-xs text-primary hover:underline justify-start"
                                            onClick={() => navigate(`/nlq-store/templates/${tpl.id}`)}
                                        >
                                            {tpl.intentKey}
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={tpl.sageType === '100' ? 'default' : 'outline'}>
                                            Sage {tpl.sageType}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">{tpl.defaultVizType}</TableCell>
                                    <TableCell className="max-w-xs truncate font-mono text-[10px]" title={tpl.sqlQuery}>
                                        {tpl.sqlQuery}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={isActive(tpl) ? 'success' : 'destructive'}>
                                            {isActive(tpl) ? t('nlqStore.active') : t('nlqStore.inactive')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">{t('common.actions')}</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigate(`/nlq-store/templates/${tpl.id}`)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    {t('common.view')}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className={isActive(tpl) ? 'text-destructive focus:text-destructive' : ''}
                                                    onClick={() => setToggleTarget(tpl)}
                                                >
                                                    {isActive(tpl) ? t('kpiStore.deactivate') : t('kpiStore.activate')}
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

            <ConfirmDialog
                open={toggleTarget !== null}
                onOpenChange={(open) => { if (!open) setToggleTarget(null); }}
                title={t('kpiStore.toggleConfirmTitle')}
                description={t('kpiStore.toggleConfirmDesc')}
                onConfirm={handleToggle}
                isPending={isToggling}
                confirmLabel={t('common.confirm')}
                cancelLabel={t('common.cancel')}
            />
        </div>
    );
}
