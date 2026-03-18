import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export interface FilterOption {
    label: string;
    value: string;
}

export interface FilterConfig {
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

interface FilterBarProps {
    filters: FilterConfig[];
    onReset: () => void;
    hasActiveFilters: boolean;
}

export function FilterBar({ filters, onReset, hasActiveFilters }: FilterBarProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
                <Select
                    key={filter.key}
                    value={filter.value || '__all__'}
                    onValueChange={(val) => filter.onChange(val === '__all__' ? '' : val)}
                >
                    <SelectTrigger className="h-8 w-auto min-w-[130px] text-sm">
                        <SelectValue placeholder={filter.placeholder || filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">{filter.label} — {t('common.all', 'Tous')}</SelectItem>
                        {filter.options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ))}
            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    onClick={onReset}
                >
                    <X className="h-3.5 w-3.5 mr-1" />
                    {t('common.reset', 'Réinitialiser')}
                </Button>
            )}
        </div>
    );
}
