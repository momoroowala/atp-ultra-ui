import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarCall } from '@/hooks/useCalendarCalls';
import { formatTimeInUserTZ, convertToUserTimezone } from '@/utils/timezoneHelpers';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';

interface UpcomingCallsSidePanelProps {
  calls: CalendarCall[];
  onCallClick: (call: CalendarCall) => void;
}

export const UpcomingCallsSidePanel = ({ calls, onCallClick }: UpcomingCallsSidePanelProps) => {
  return (
    <Card className="flex flex-col h-fit max-h-[calc(100vh-16rem)]">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold text-base">Upcoming Calls</h3>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 flex-1 overflow-hidden">
        {calls.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No upcoming calls</p>
        ) : (
          <ScrollArea className="h-full max-h-[calc(100vh-22rem)]">
            <div className="space-y-3 pr-2">
              {calls.map((call, index) => {
                const isNext = index === 0;
                const dateObj = convertToUserTimezone(call.call_date, call.call_time, call.timezone);
                const dayLabel = format(dateObj, 'EEE, MMM d');
                const timeLabel = formatTimeInUserTZ(call.call_date, call.call_time, call.timezone).replace(/ [A-Z]{3,4}$/, '');

                return (
                  <button
                    key={call.id}
                    onClick={() => onCallClick(call)}
                    className={`
                      w-full text-left p-3 rounded-lg border transition-colors
                      ${isNext
                        ? 'border-primary bg-primary/5 hover:bg-primary/10'
                        : 'border-border hover:bg-accent'}
                    `}
                  >
                    <div className="font-medium text-sm truncate">{call.title}</div>
                    <div className="text-xs text-primary mt-1 font-medium">
                      {dayLabel} at {timeLabel}
                    </div>
                    {call.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {call.description}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
