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
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { nlqApi } from '@/api';
import { Button } from '@/components/ui/button';

interface NlqIntent {
    id: string;
    key: string;
    label: string;
    category: string;
    keywords: string[];
}

export function NlqIntentsTab() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [intents, setIntents] = useState<NlqIntent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchIntents = async () => {
            try {
                const response = await nlqApi.getAllIntents();
                setIntents(response.data);
            } catch (error) {
                console.error('Failed to fetch intents:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchIntents();
    }, []);

    const filteredIntents = intents.filter(i =>
        i.label.toLowerCase().includes(search.toLowerCase()) ||
        i.key.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('common.search')}
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('nlqStore.intentKey')}</TableHead>
                            <TableHead>{t('nlqStore.intentLabel')}</TableHead>
                            <TableHead>{t('nlqStore.intentCategory')}</TableHead>
                            <TableHead>{t('nlqStore.intentKeywords')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    {t('common.loading')}
                                </TableCell>
                            </TableRow>
                        ) : filteredIntents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    {t('common.noData')}
                                </TableCell>
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
                                                <Badge key={idx} variant="secondary" className="text-[10px]">
                                                    {kw}
                                                </Badge>
                                            ))}
                                        </div>
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
