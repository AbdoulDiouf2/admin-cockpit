import { useState } from 'react';
import { format, parseISO, setHours, setMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarIcon, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DateTimePicker({ value, onChange, placeholder, className }: DateTimePickerProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'fr' ? fr : undefined;

  const parsed = value ? parseISO(value) : undefined;
  const [timeStr, setTimeStr] = useState(parsed ? format(parsed, 'HH:mm') : '09:00');

  function handleDaySelect(date: Date) {
    const [h, m] = timeStr.split(':').map(Number);
    const combined = setMinutes(setHours(date, h || 0), m || 0);
    onChange(format(combined, "yyyy-MM-dd'T'HH:mm"));
  }

  function handleTimeChange(t: string) {
    setTimeStr(t);
    if (parsed) {
      const [h, m] = t.split(':').map(Number);
      const combined = setMinutes(setHours(parsed, h || 0), m || 0);
      onChange(format(combined, "yyyy-MM-dd'T'HH:mm"));
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-start text-left font-normal h-9', !value && 'text-muted-foreground', className)}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {parsed
            ? format(parsed, 'PPP HH:mm', { locale })
            : <span>{placeholder ?? 'Sélectionner date et heure…'}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          selected={parsed}
          onSelect={handleDaySelect}
          locale={locale}
        />
        <div className="border-t p-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            type="time"
            value={timeStr}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="h-8 w-28"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
