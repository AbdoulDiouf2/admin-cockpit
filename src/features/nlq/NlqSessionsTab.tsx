import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { nlqApi } from '@/api';
import { format } from 'date-fns';

interface NlqSession {
    id: string;
    queryText: string;
    status: string;
    intentKey: string | null;
    latencyMs: number | null;
    createdAt: string;
    organization: { id: string; name: string };
    user: { id: string; email: string; firstName: string | null; lastName: string | null };
    intent: { key: string; label: string } | null;
}

const STATUS_CLASSES: Record<string, string> = {
    success: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-200',
    error: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-200',
    pending: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-200',
    no_intent: 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-200',
};

const PAGE_SIZE = 25;

function userName(user: NlqSession['user']): string {
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return full || user.email;
}

export function NlqSessionsTab() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<NlqSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterOrg, setFilterOrg] = useState<string>('all');
    const [filterIntent, setFilterIntent] = useState<string>('all');

    // Pagination
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await nlqApi.getAllSessions();
                setSessions(response.data);
            } catch (error) {
                console.error('Failed to fetch NLQ sessions:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSessions();
    }, []);

    // Dériver les options de filtres depuis les données
    const orgOptions = useMemo(() => {
        const map = new Map<string, string>();
        sessions.forEach(s => map.set(s.organization.id, s.organization.name));
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [sessions]);

    const intentOptions = useMemo(() => {
        const map = new Map<string, string>();
        sessions.forEach(s => {
            if (s.intent) map.set(s.intent.key, s.intent.label);
        });
        return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [sessions]);

    const statusLabel = (status: string) => {
        const map: Record<string, string> = {
            success: t('nlqStore.statusSuccess'),
            error: t('nlqStore.statusError'),
            pending: t('nlqStore.statusPending'),
            no_intent: t('nlqStore.statusNoIntent'),
        };
        return map[status] ?? status;
    };

    // Filtrage
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return sessions.filter(s => {
            if (filterStatus !== 'all' && s.status !== filterStatus) return false;
            if (filterOrg !== 'all' && s.organization.id !== filterOrg) return false;
            if (filterIntent !== 'all' && s.intentKey !== filterIntent) return false;
            if (q) {
                const name = userName(s.user).toLowerCase();
                return (
                    s.queryText.toLowerCase().includes(q) ||
                    s.organization.name.toLowerCase().includes(q) ||
                    (s.intent?.label ?? '').toLowerCase().includes(q) ||
                    name.includes(q)
                );
            }
            return true;
        });
    }, [sessions, search, filterStatus, filterOrg, filterIntent]);

    // Réinitialiser la page quand les filtres changent
    useEffect(() => { setPage(1); }, [search, filterStatus, filterOrg, filterIntent]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const hasActiveFilters = filterStatus !== 'all' || filterOrg !== 'all' || filterIntent !== 'all' || search !== '';

    const resetFilters = () => {
        setSearch('');
        setFilterStatus('all');
        setFilterOrg('all');
        setFilterIntent('all');
    };

    return (
        <div className="space-y-4">
            {/* Barre de filtres */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('common.search')}
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Filtre Statut */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder={t('nlqStore.sessionStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="success">{t('nlqStore.statusSuccess')}</SelectItem>
                        <SelectItem value="error">{t('nlqStore.statusError')}</SelectItem>
                        <SelectItem value="pending">{t('nlqStore.statusPending')}</SelectItem>
                        <SelectItem value="no_intent">{t('nlqStore.statusNoIntent')}</SelectItem>
                    </SelectContent>
                </Select>

                {/* Filtre Organisation */}
                {orgOptions.length > 0 && (
                    <Select value={filterOrg} onValueChange={setFilterOrg}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder={t('nlqStore.sessionOrg')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les orgs</SelectItem>
                            {orgOptions.map(([id, name]) => (
                                <SelectItem key={id} value={id}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Filtre Intention */}
                {intentOptions.length > 0 && (
                    <Select value={filterIntent} onValueChange={setFilterIntent}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder={t('nlqStore.sessionIntent')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les intentions</SelectItem>
                            {intentOptions.map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground">
                        <X className="h-3.5 w-3.5" />
                        Réinitialiser
                    </Button>
                )}

                <span className="ml-auto text-sm text-muted-foreground whitespace-nowrap">
                    {filtered.length} session{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-32">{t('nlqStore.sessionDate')}</TableHead>
                            <TableHead>{t('nlqStore.sessionQuery')}</TableHead>
                            <TableHead>{t('nlqStore.sessionIntent')}</TableHead>
                            <TableHead className="w-36">{t('nlqStore.sessionStatus')}</TableHead>
                            <TableHead>{t('nlqStore.sessionOrg')}</TableHead>
                            <TableHead>{t('nlqStore.sessionUser')}</TableHead>
                            <TableHead className="text-right w-24">{t('nlqStore.sessionLatency')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    {t('common.loading')}
                                </TableCell>
                            </TableRow>
                        ) : paginated.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24">
                                    {t('common.noData')}
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginated.map((session) => (
                                <TableRow
                                    key={session.id}
                                    className="cursor-pointer"
                                    onClick={() => navigate(`/nlq-store/sessions/${session.id}`)}
                                >
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {format(new Date(session.createdAt), 'dd/MM/yyyy HH:mm')}
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                        <p className="truncate text-sm font-medium text-primary hover:underline" title={session.queryText}>
                                            {session.queryText}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        {session.intent ? (
                                            <span className="text-xs text-muted-foreground">
                                                {session.intent.label}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            <Badge
                                                variant="outline"
                                                className={STATUS_CLASSES[session.status]}
                                            >
                                                {statusLabel(session.status)}
                                            </Badge>
                                            <span className="font-mono text-[10px] text-muted-foreground">
                                                {session.status}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {session.organization.name}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {userName(session.user)}
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                                        {session.latencyMs != null ? `${session.latencyMs} ms` : '—'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Page {page} / {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {/* Pages autour de la page courante */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                            .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((item, idx) =>
                                item === 'ellipsis' ? (
                                    <span key={`e-${idx}`} className="px-1 text-muted-foreground">…</span>
                                ) : (
                                    <Button
                                        key={item}
                                        variant={item === page ? 'default' : 'outline'}
                                        size="sm"
                                        className="w-8"
                                        onClick={() => setPage(item as number)}
                                    >
                                        {item}
                                    </Button>
                                )
                            )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
