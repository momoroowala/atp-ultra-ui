import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { CalendarCall } from '@/hooks/useCalendarCalls';
import { CallCardRedesigned } from './CallCardRedesigned';
import { format } from 'date-fns';
import { getDateInUserTimezone } from '@/utils/timezoneHelpers';
import { parseDateAsLocal } from '@/utils/dateHelpers';
import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';

interface CalendarViewProps {
  calls: CalendarCall[];
  isAdmin: boolean;
  userTierId: string | null;
  upsellUrl: string | null | undefined;
  onEdit: (call: CalendarCall) => void;
  onDelete: (id: string) => void;
  onDeleteSeries?: (seriesId: string) => void;
  onViewDetails: (call: CalendarCall) => void;
}

export const CalendarView = ({
  calls,
  isAdmin,
  userTierId,
  upsellUrl,
  onEdit,
  onDelete,
  onDeleteSeries,
  onViewDetails,
}: CalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Get unique dates that have calls
  const datesWithCalls = useMemo(() => {
    return calls.map((call) => parseDateAsLocal(getDateInUserTimezone(call.call_date, call.call_time, call.timezone)));
  }, [calls]);

  // Filter calls for selected date
  const callsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const selectedStr = format(selectedDate, 'yyyy-MM-dd');
    return calls.filter((call) => getDateInUserTimezone(call.call_date, call.call_time, call.timezone) === selectedStr);
  }, [calls, selectedDate]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Calendar */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-2">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          modifiers={{ hasCall: datesWithCalls }}
          modifiersClassNames={{ hasCall: 'has-call-dot' }}
          className={cn('p-3 pointer-events-auto')}
        />
      </div>

      {/* Selected date calls */}
      <div className="w-full max-w-2xl">
        {selectedDate && (
          <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
        )}

        {callsForSelectedDate.length > 0 ? (
          <div className="space-y-3">
            {callsForSelectedDate.map((call) => (
              <CallCardRedesigned
                key={call.id}
                call={call}
                isAdmin={isAdmin}
                userTierId={userTierId}
                upsellUrl={upsellUrl}
                onEdit={onEdit}
                onDelete={onDelete}
                onDeleteSeries={onDeleteSeries}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        ) : selectedDate ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No calls on this date</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
