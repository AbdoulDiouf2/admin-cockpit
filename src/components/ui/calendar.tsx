import { useState } from 'react';
import type { Locale } from 'date-fns';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  locale?: Locale;
  initialFocus?: boolean;
  className?: string;
}

export function Calendar({ selected, onSelect, locale, className }: CalendarProps) {
  const [viewMonth, setViewMonth] = useState(selected ?? new Date());

  const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  const dayHeaders = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 1 + i); // Monday-based week starting Jan 1 2024
    return format(d, 'EEEEE', { locale });
  });

  return (
    <div className={cn('p-3 select-none', className)}>
      {/* Header nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          className={cn(buttonVariants({ variant: 'outline' }), 'h-7 w-7 p-0 opacity-50 hover:opacity-100')}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium capitalize">
          {format(viewMonth, 'MMMM yyyy', { locale })}
        </span>
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className={cn(buttonVariants({ variant: 'outline' }), 'h-7 w-7 p-0 opacity-50 hover:opacity-100')}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayHeaders.map((d, i) => (
          <div key={i} className="text-center text-muted-foreground text-[0.8rem] font-normal w-8 mx-auto">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const isSelected = selected ? isSameDay(day, selected) : false;
          const isOutside = !isSameMonth(day, viewMonth);
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect?.(day)}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'h-8 w-8 p-0 font-normal mx-auto',
                isSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
                !isSelected && isToday && 'bg-accent text-accent-foreground',
                isOutside && 'text-muted-foreground opacity-50',
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
