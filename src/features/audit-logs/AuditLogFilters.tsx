import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Download, X } from 'lucide-react';
import type { AuditLogFilters as Filters } from '@/hooks/use-api';

interface AuditLogFiltersProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
    onExport: () => void;
    eventTypes: { event: string; count: number }[];
}

export function AuditLogFilters({
    filters,
    onFiltersChange,
    onExport,
    eventTypes,
}: AuditLogFiltersProps) {
    const { t } = useTranslation();

    const hasActiveFilters = !!(filters.event || filters.startDate || filters.endDate);

    const clearFilters = () => {
        onFiltersChange({ limit: filters.limit, offset: 0 });
    };

    return (
        <div className="flex flex-wrap items-center gap-3 pb-4">
            {/* Event filter */}
            <Select
                value={filters.event || '_all'}
                onValueChange={(value) =>
                    onFiltersChange({
                        ...filters,
                        event: value === '_all' ? undefined : value,
                        offset: 0,
                    })
                }
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={t('auditLogs.allEvents')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="_all">{t('auditLogs.allEvents')}</SelectItem>
                    {eventTypes.map((et) => (
                        <SelectItem key={et.event} value={et.event}>
                            {et.event}
                            <span className="ml-2 text-xs text-muted-foreground">
                                ({et.count})
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Start date */}
            <div className="flex flex-col gap-1">
                <Input
                    type="date"
                    className="w-[160px]"
                    value={filters.startDate || ''}
                    placeholder={t('auditLogs.startDate')}
                    onChange={(e) =>
                        onFiltersChange({
                            ...filters,
                            startDate: e.target.value || undefined,
                            offset: 0,
                        })
                    }
                    title={t('auditLogs.startDate')}
                />
            </div>

            {/* End date */}
            <div className="flex flex-col gap-1">
                <Input
                    type="date"
                    className="w-[160px]"
                    value={filters.endDate || ''}
                    placeholder={t('auditLogs.endDate')}
                    onChange={(e) =>
                        onFiltersChange({
                            ...filters,
                            endDate: e.target.value || undefined,
                            offset: 0,
                        })
                    }
                    title={t('auditLogs.endDate')}
                />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Réinitialiser
                </Button>
            )}

            {/* Export button - pushed to right */}
            <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={onExport}>
                    <Download className="h-4 w-4 mr-2" />
                    {t('auditLogs.exportCsv')}
                </Button>
            </div>
        </div>
    );
}
