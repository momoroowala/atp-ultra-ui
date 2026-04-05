import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { parseDateAsLocal } from '@/utils/dateHelpers';
import { Calendar } from 'lucide-react';

interface DateGroupHeaderProps {
  dateStr: string;
  showConnector?: boolean;
}

export const DateGroupHeader = ({ dateStr, showConnector = true }: DateGroupHeaderProps) => {
  const formatDateGroupLabel = (dateString: string) => {
    const date = parseDateAsLocal(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dayLabel: string;
    if (isToday(date)) {
      dayLabel = "Today";
    } else if (isTomorrow(date)) {
      dayLabel = "Tomorrow";
    } else {
      const daysUntil = differenceInDays(date, today);
      dayLabel = `in ${daysUntil} days`;
    }
    
    return {
      dateFormatted: format(date, "MMM d"),
      dayLabel,
      weekday: format(date, "EEEE"),
    };
  };

  const { dateFormatted, dayLabel, weekday } = formatDateGroupLabel(dateStr);

  return (
    <div className="flex items-center gap-3">
      {/* Timeline connector dot */}
      {showConnector && (
        <div className="flex flex-col items-center">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary-light))]" />
        </div>
      )}
      
      {/* Date pill */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-sm">
        <Calendar className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">
          {dateFormatted} <span className="text-muted-foreground">•</span> {dayLabel} <span className="text-muted-foreground">•</span> {weekday}
        </span>
      </div>
    </div>
  );
};
