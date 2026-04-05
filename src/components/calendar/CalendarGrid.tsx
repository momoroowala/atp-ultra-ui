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
  addWeeks,
  subWeeks,
  getDay
} from 'date-fns';
import { formatTimeInUserTZ, getDateInUserTimezone } from '@/utils/timezoneHelpers';
import { useState, useEffect, useMemo, Fragment } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Mock / demo data generator
// ---------------------------------------------------------------------------

type ViewMode = 'week' | 'month';

const MOCK_CALL_DEFINITIONS = [
  { title: 'Warehouse Call',       dayOfWeek: 1, hour: 10, minute: 0 },
  { title: 'Mindset Monday',      dayOfWeek: 1, hour: 9,  minute: 0 },
  { title: 'Brand Outreach Call',  dayOfWeek: 2, hour: 14, minute: 0 },
  { title: 'Training Session',    dayOfWeek: 3, hour: 11, minute: 0 },
  { title: 'Brand Outreach Call',  dayOfWeek: 4, hour: 14, minute: 0 },
  { title: 'Q&A Session',         dayOfWeek: 5, hour: 15, minute: 0 },
] as const;

function generateMockCalls(rangeStart: Date, rangeEnd: Date): CalendarCall[] {
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const calls: CalendarCall[] = [];

  for (const day of days) {
    const dow = getDay(day); // 0=Sun ... 6=Sat
    for (const def of MOCK_CALL_DEFINITIONS) {
      if (dow !== def.dayOfWeek) continue;

      const dateStr = format(day, 'yyyy-MM-dd');
      const timeStr = `${String(def.hour).padStart(2, '0')}:${String(def.minute).padStart(2, '0')}`;

      calls.push({
        id: `mock-${def.title.replace(/\s+/g, '-').toLowerCase()}-${dateStr}`,
        title: def.title,
        description: 'Demo event',
        call_date: dateStr,
        call_time: timeStr,
        timezone: 'America/New_York',
        call_link: '',
        is_recurring: true,
        recurrence_pattern: null,
        series_id: null,
        google_calendar_event_id: null,
        visible_tiers: null,
        visible_tier_ids: null,
        created_by: 'demo',
        is_active: true,
        created_at: null,
        updated_at: null,
      });
    }
  }

  return calls;
}

function isMockCall(call: CalendarCall): boolean {
  return call.id.startsWith('mock-');
}

// ---------------------------------------------------------------------------
// localStorage helpers for view pref
// ---------------------------------------------------------------------------

function getStoredViewPref(): ViewMode {
  try {
    const val = localStorage.getItem('calendar_view_pref');
    if (val === 'week' || val === 'month') return val;
  } catch { /* ignore */ }
  return 'month';
}

function setStoredViewPref(v: ViewMode) {
  try {
    localStorage.setItem('calendar_view_pref', v);
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CalendarGridProps {
  calls: CalendarCall[];
  onCallClick: (call: CalendarCall) => void;
}

const HOUR_SLOTS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM .. 9 PM

export const CalendarGrid = ({ calls, onCallClick }: CalendarGridProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewPref);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedDayCalls, setSelectedDayCalls] = useState<CalendarCall[]>([]);
  const isMobile = useIsMobile();

  // Persist view pref
  useEffect(() => {
    setStoredViewPref(viewMode);
  }, [viewMode]);

  // ---------- Month calculations ----------
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // ---------- Week calculations ----------
  const weekEnd = endOfWeek(currentWeekStart);
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  // ---------- Mock data generation ----------
  const mockCalls = useMemo(() => {
    if (viewMode === 'week') {
      // Generate for surrounding 3 weeks to handle navigation
      const padStart = subWeeks(currentWeekStart, 1);
      const padEnd = addWeeks(weekEnd, 1);
      return generateMockCalls(padStart, padEnd);
    }
    // Month: generate for surrounding months
    const padStart = subWeeks(calendarStart, 1);
    const padEnd = addWeeks(calendarEnd, 1);
    return generateMockCalls(padStart, padEnd);
  }, [viewMode, currentWeekStart, currentMonth]);

  // Merge real + mock, real calls take priority (dedupe by matching title+date+time)
  const mergedCalls = useMemo(() => {
    const realSet = new Set(
      calls.map(c => `${c.title}::${c.call_date}::${c.call_time}`)
    );
    const filteredMock = mockCalls.filter(
      mc => !realSet.has(`${mc.title}::${mc.call_date}::${mc.call_time}`)
    );
    return [...calls, ...filteredMock];
  }, [calls, mockCalls]);

  // ---------- Helpers ----------
  const getCallsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return mergedCalls.filter(call => {
      // Get the date in user's timezone (accounts for day changes due to TZ conversion)
      const userDate = getDateInUserTimezone(call.call_date, call.call_time, call.timezone);
      return userDate === dayStr;
    });
  };

  // ---------- Month navigation ----------
  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // ---------- Week navigation ----------
  const previousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };
  const nextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  // ---------- Unified navigation ----------
  const goPrevious = viewMode === 'week' ? previousWeek : previousMonth;
  const goNext = viewMode === 'week' ? nextWeek : nextMonth;

  const goToToday = () => {
    setCurrentMonth(new Date());
    setCurrentWeekStart(startOfWeek(new Date()));
  };

  const openDayCallsDialog = (day: Date, dayCalls: CalendarCall[]) => {
    setSelectedDay(day);
    setSelectedDayCalls(dayCalls);
  };

  const closeDayCallsDialog = () => {
    setSelectedDay(null);
    setSelectedDayCalls([]);
  };

  // ---------- Header title ----------
  const headerTitle =
    viewMode === 'week'
      ? `${format(currentWeekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
      : format(currentMonth, 'MMMM yyyy');

  // ---------- Previous / Next aria labels ----------
  const prevLabel = viewMode === 'week' ? 'Previous week' : 'Previous month';
  const nextLabel = viewMode === 'week' ? 'Next week' : 'Next month';

  // ---------- Helper to parse hour from call_time ----------
  const getCallHour = (call: CalendarCall): number => {
    const [h] = call.call_time.split(':').map(Number);
    return h;
  };

  const getCallMinute = (call: CalendarCall): number => {
    const parts = call.call_time.split(':').map(Number);
    return parts[1] || 0;
  };

  return (
    <Card>
      <CardHeader className="p-3 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg md:text-xl font-semibold">
            {headerTitle}
          </h2>
          <div className="flex items-center gap-2 md:gap-3">
            {/* View toggle */}
            <div className="flex bg-muted rounded-lg p-0.5">
              <button
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'week'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground'
                )}
                onClick={() => setViewMode('week')}
              >
                Week
              </button>
              <button
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  viewMode === 'month'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground'
                )}
                onClick={() => setViewMode('month')}
              >
                Month
              </button>
            </div>

            {/* Navigation */}
            <div className="flex gap-1 md:gap-2">
              <Button variant="outline" size="sm" onClick={goPrevious} aria-label={prevLabel}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="hidden md:inline-flex">
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="md:hidden" aria-label="Go to today">
                •
              </Button>
              <Button variant="outline" size="sm" onClick={goNext} aria-label={nextLabel}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-2 md:p-6">
        {/* =================== WEEK VIEW =================== */}
        {viewMode === 'week' && (
          <>
            {/* Day headers */}
            <div className="grid gap-px md:gap-1" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
              {/* Spacer for time gutter */}
              <div />
              {weekDays.map(day => {
                const today = isToday(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'text-center py-2 text-sm font-medium rounded-t-md',
                      today ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    )}
                  >
                    <div className="hidden md:block">{format(day, 'EEE')}</div>
                    <div className="md:hidden">{format(day, 'EEEEE')}</div>
                    <div className={cn('text-lg font-semibold', today ? 'text-primary' : 'text-foreground')}>
                      {format(day, 'd')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div
              className="grid gap-px md:gap-0 overflow-y-auto"
              style={{
                gridTemplateColumns: '56px repeat(7, 1fr)',
                maxHeight: '600px',
              }}
            >
              {HOUR_SLOTS.map(hour => (
                <Fragment key={`hour-row-${hour}`}>
                  {/* Time label */}
                  <div
                    className="text-xs text-muted-foreground text-right pr-2 pt-1 h-16 border-t border-border"
                  >
                    {hour === 0
                      ? '12 AM'
                      : hour < 12
                        ? `${hour} AM`
                        : hour === 12
                          ? '12 PM'
                          : `${hour - 12} PM`}
                  </div>

                  {/* Day columns for this hour */}
                  {weekDays.map(day => {
                    const dayCalls = getCallsForDay(day);
                    const hourCalls = dayCalls.filter(c => getCallHour(c) === hour);
                    const today = isToday(day);

                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className={cn(
                          'relative h-16 border-t border-border',
                          today ? 'bg-primary/[0.03]' : ''
                        )}
                      >
                        {hourCalls.map(call => {
                          const mins = getCallMinute(call);
                          const topOffset = (mins / 60) * 100;
                          const mock = isMockCall(call);

                          return (
                            <button
                              key={call.id}
                              onClick={() => onCallClick(call)}
                              className={cn(
                                'absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-left transition-colors overflow-hidden z-10',
                                'bg-primary/15 hover:bg-primary/25 border-l-[3px] border-primary',
                                'min-h-[2.5rem]'
                              )}
                              style={{ top: `${topOffset}%` }}
                              title={`${call.title} - ${formatTimeInUserTZ(call.call_date, call.call_time, call.timezone)}`}
                            >
                              <div className="font-semibold text-sm leading-tight truncate">
                                {call.title}
                                {mock && (
                                  <Badge variant="outline" className="ml-1.5 text-[9px] px-1 py-0 leading-tight align-middle">
                                    Demo
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {formatTimeInUserTZ(call.call_date, call.call_time, call.timezone).replace(/ [A-Z]{3,4}$/, '')}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </>
        )}

        {/* =================== MONTH VIEW =================== */}
        {viewMode === 'month' && (
          <>
            {/* Week days header */}
            <div className="grid grid-cols-7 gap-px md:gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs md:text-sm font-medium text-muted-foreground p-1 md:p-2">
                  <span className="hidden md:inline">{day}</span>
                  <span className="md:hidden">{day.charAt(0)}</span>
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px md:gap-2">
              {monthDays.map((day) => {
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
                        {dayCalls.slice(0, 2).map((call) => {
                          const mock = isMockCall(call);
                          return (
                            <button
                              key={call.id}
                              onClick={() => onCallClick(call)}
                              className="w-full text-left text-xs p-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors truncate"
                            >
                              <div className="font-medium truncate">
                                {call.title}
                                {mock && (
                                  <Badge variant="outline" className="ml-1 text-[9px] px-1 py-0 leading-tight align-middle">
                                    Demo
                                  </Badge>
                                )}
                              </div>
                              <div className="text-muted-foreground truncate">
                                {formatTimeInUserTZ(call.call_date, call.call_time, call.timezone).replace(/ [A-Z]{3,4}$/, '')}
                              </div>
                            </button>
                          );
                        })}
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
          </>
        )}
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
            {selectedDayCalls.map((call) => {
              const mock = isMockCall(call);
              return (
                <button
                  key={call.id}
                  onClick={() => {
                    onCallClick(call);
                    closeDayCallsDialog();
                  }}
                  className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="font-medium">
                    {call.title}
                    {mock && (
                      <Badge variant="outline" className="ml-1.5 text-[9px] px-1 py-0 leading-tight align-middle">
                        Demo
                      </Badge>
                    )}
                  </div>
                  {call.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {call.description}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatTimeInUserTZ(call.call_date, call.call_time, call.timezone)}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
