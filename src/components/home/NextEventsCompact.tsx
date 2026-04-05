import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { useCalendarCalls } from '@/hooks/useCalendarCalls';
import { formatTimeInUserTZ, convertToUserTimezone, isCallUpcomingInUserTZ } from '@/utils/timezoneHelpers';

export const NextEventsCompact = () => {
  const { calls, isLoading } = useCalendarCalls();

  // Get next upcoming call
  const upcomingCall = useMemo(() => {
    return calls.find(call => isCallUpcomingInUserTZ(call.call_date, call.call_time, call.timezone));
  }, [calls]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-12 w-full bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Next Events</h4>
      
      {!upcomingCall ? (
        <p className="text-sm text-muted-foreground">No upcoming events</p>
      ) : (
        <div>
          {(() => {
            const userDate = convertToUserTimezone(upcomingCall.call_date, upcomingCall.call_time, upcomingCall.timezone);
            const formattedTime = formatTimeInUserTZ(upcomingCall.call_date, upcomingCall.call_time, upcomingCall.timezone);

            return (
              <div
                className="cursor-pointer group"
                onClick={() => window.open(upcomingCall.call_link, '_blank')}
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">{format(userDate, 'd MMM').toUpperCase()} - AT {formattedTime.toUpperCase()}</span>
                </div>
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {upcomingCall.title}
                </p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
