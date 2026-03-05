import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';

interface NlqTemplate {
    id: string;
    intentKey: string;
    sageType: string;
    sqlQuery: string;
    defaultVizType: string;
    active: boolean;
    intent?: { label: string };
}

export function NlqTemplatesTab() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<NlqTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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
        fetchTemplates();
    }, []);

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('nlqStore.templateIntent')}</TableHead>
                            <TableHead>{t('nlqStore.templateSageType')}</TableHead>
                            <TableHead>{t('nlqStore.templateVizType')}</TableHead>
                            <TableHead>{t('nlqStore.templateQuery')}</TableHead>
                            <TableHead>{t('common.status')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    {t('common.loading')}
                                </TableCell>
                            </TableRow>
                        ) : templates.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    {t('common.noData')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            templates.map((tpl) => (
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
                                        <Badge variant={tpl.active ? 'success' : 'destructive'}>
                                            {tpl.active ? t('nlqStore.active') : t('nlqStore.inactive')}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
