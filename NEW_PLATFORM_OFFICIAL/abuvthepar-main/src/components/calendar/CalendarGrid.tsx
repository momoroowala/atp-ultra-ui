import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarCall } from '@/hooks/useCalendarCalls';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isSameDay
} from 'date-fns';
import { formatTimeInUserTZ, getDateInUserTimezone, formatTimeInEST, getDateInEST } from '@/utils/timezoneHelpers';
import type { TzMode } from './TimezoneToggle';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CalendarGridProps {
  calls: CalendarCall[];
  onCallClick: (call: CalendarCall) => void;
  tzMode?: TzMode;
}

export const CalendarGrid = ({ calls, onCallClick, tzMode = 'local' }: CalendarGridProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDayCalls, setSelectedDayCalls] = useState<CalendarCall[]>([]);
  const isMobile = useIsMobile();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDateFn = tzMode === 'est' ? getDateInEST : getDateInUserTimezone;
  const formatTimeFn = tzMode === 'est' ? formatTimeInEST : formatTimeInUserTZ;

  const getCallsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return calls.filter(call => {
      const userDate = getDateFn(call.call_date, call.call_time, call.timezone);
      return userDate === dayStr;
    });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const openDayCallsDialog = (day: Date, dayCalls: CalendarCall[]) => {
    setSelectedDay(day);
    setSelectedDayCalls(dayCalls);
  };

  const closeDayCallsDialog = () => {
    setSelectedDay(null);
    setSelectedDayCalls([]);
  };

  return (
    <Card>
      <CardHeader className="p-3 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-1 md:gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="hidden md:inline-flex">
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="md:hidden" aria-label="Go to today">
              •
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-px md:gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div key={day} className="text-center text-xs md:text-sm font-medium text-muted-foreground p-1 md:p-2">
              <span className="hidden md:inline">{day}</span>
              <span className="md:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px md:gap-2">
          {days.map((day) => {
            const dayCalls = getCallsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isTodayDate = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                onClick={() => isMobile && dayCalls.length > 0 && openDayCallsDialog(day, dayCalls)}
                className={`
                  relative aspect-square md:aspect-auto md:min-h-24 p-0.5 md:p-2 border rounded md:rounded-lg
                  ${isTodayDate ? 'border-primary bg-primary/5' : 'border-border'}
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                  ${isMobile && dayCalls.length > 0 ? 'cursor-pointer hover:bg-accent/50 transition-colors' : ''}
                `}
              >
                <div className={`text-[10px] md:text-sm font-medium md:mb-1 ${isTodayDate ? 'text-primary' : ''} absolute top-0.5 left-0.5 md:static`}>
                  {format(day, 'd')}
                </div>
                
                {/* Mobile view: Show badge with call count */}
                {isMobile && dayCalls.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute bottom-0.5 right-0.5 px-1.5 py-0.5 text-[10px] leading-none rounded-full"
                  >
                    {dayCalls.length}
                    <span className="sr-only"> {dayCalls.length === 1 ? 'call' : 'calls'} on {format(day, 'PPP')}</span>
                  </Badge>
                )}

                {/* Desktop view: Show call cards */}
                {!isMobile && (
                  <div className="space-y-1">
                    {dayCalls.slice(0, 2).map((call) => (
                      <button
                        key={call.id}
                        onClick={() => onCallClick(call)}
                        className="w-full text-left text-xs p-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors truncate"
                      >
                        <div className="font-medium truncate">{call.title}</div>
                        <div className="text-muted-foreground truncate">
                          {formatTimeFn(call.call_date, call.call_time, call.timezone).replace(/ [A-Z]{3,4}$/, '')}
                        </div>
                      </button>
                    ))}
                    {dayCalls.length > 2 && (
                      <button
                        onClick={() => openDayCallsDialog(day, dayCalls)}
                        className="text-xs text-muted-foreground hover:text-foreground px-1 transition-colors cursor-pointer"
                      >
                        +{dayCalls.length - 2} more
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Day calls dialog */}
      <Dialog open={selectedDay !== null} onOpenChange={closeDayCallsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedDayCalls.map((call) => (
              <button
                key={call.id}
                onClick={() => {
                  onCallClick(call);
                  closeDayCallsDialog();
                }}
                className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="font-medium">{call.title}</div>
                {call.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {call.description}
                  </div>
                )}
                <div className="text-sm text-muted-foreground mt-1">
                  {formatTimeFn(call.call_date, call.call_time, call.timezone)}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
