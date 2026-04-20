import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCalendarCalls } from "@/hooks/useCalendarCalls";
import { useCallRecordings } from "@/hooks/useCallRecordings";
import { useFathomNotesForRecordings } from "@/hooks/useFathomNotes";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useRoleCheck } from "@/hooks/useRoleCheck";
import { useUserTier } from "@/hooks/useUserTier";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CallCardRedesigned } from "@/components/calendar/CallCardRedesigned";
import { RecordingsFolderView } from "@/components/calendar/RecordingsFolderView";
import { DateGroupHeader } from "@/components/calendar/DateGroupHeader";
import { DEMO_RECORDINGS } from "@/utils/demoData";
import { CallCreateModal } from "@/components/calendar/CallCreateModal";
import { CallEditModal } from "@/components/calendar/CallEditModal";
import { RecordingCreateModal } from "@/components/calendar/RecordingCreateModal";
import { RecordingEditModal } from "@/components/calendar/RecordingEditModal";
import { CalendarCallModal } from "@/components/calendar/CalendarCallModal";
// CalendarGrid and UpcomingCallsSidePanel removed -- replaced by WeekListView
import { RecordingModal } from "@/components/calendar/RecordingModal";
import { MobileLogoHeader } from "@/components/MobileLogoHeader";
import { GradientSection } from "@/components/GradientSection";
import { Plus, Upload, Info, Calendar as CalendarIcon, Play } from "lucide-react";
import { useState, useMemo } from "react";
import { format, isToday, isTomorrow, startOfWeek, endOfWeek, addWeeks, eachDayOfInterval, isSameDay, parseISO as parseISODate, getDay } from "date-fns";
import { isCallUpcomingInUserTZ, getDateInUserTimezone, formatTimeInUserTZ, convertToUserTimezone } from "@/utils/timezoneHelpers";
import { useIsMobile } from "@/hooks/use-mobile";
import { Video, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import type { CalendarCall } from "@/hooks/useCalendarCalls";
import { getDemoRsvpStatus } from "@/hooks/useCallRsvp";
import { useAuth } from "@/hooks/useAuth";

function WeekListView({ calls, onCallClick }: { calls: CalendarCall[]; onCallClick: (call: CalendarCall) => void }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const { user } = useAuth();

  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekLabel = `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`;

  // Demo call schedule (recurring weekly)
  const MOCK_SCHEDULE = [
    { title: 'Warehouse Call',      dayOfWeek: 1, time: '10:00', description: 'Weekly warehouse operations and inventory review' },
    { title: 'Mindset Monday',      dayOfWeek: 1, time: '09:00', description: 'Start the week with focus and accountability' },
    { title: 'Brand Outreach Call', dayOfWeek: 2, time: '14:00', description: 'Group session on brand outreach strategies' },
    { title: 'Training Session',    dayOfWeek: 3, time: '11:00', description: 'Hands-on training for sourcing and listing' },
    { title: 'Brand Outreach Call', dayOfWeek: 4, time: '14:00', description: 'Follow-up outreach session and role play' },
    { title: 'Q&A Session',         dayOfWeek: 5, time: '15:00', description: 'Open Q&A with coaches -- bring your questions' },
  ];

  // Merge real calls with demo calls for the week
  const callsByDay = useMemo(() => {
    const map: Record<string, CalendarCall[]> = {};
    daysOfWeek.forEach(day => {
      const key = format(day, "yyyy-MM-dd");
      const realCalls = calls.filter(call => call.call_date === key);

      // Generate demo calls for this day if no real calls
      const dow = getDay(day);
      const demoCalls: CalendarCall[] = MOCK_SCHEDULE
        .filter(m => m.dayOfWeek === dow)
        .filter(m => !realCalls.some(rc => rc.title === m.title && rc.call_time?.startsWith(m.time)))
        .map(m => ({
          id: `mock-${m.title.replace(/\s+/g, '-').toLowerCase()}-${key}`,
          title: m.title,
          description: m.description,
          call_date: key,
          call_time: m.time,
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
          created_at: null as any,
          updated_at: null as any,
        }));

      map[key] = [...realCalls, ...demoCalls].sort((a, b) => (a.call_time || '').localeCompare(b.call_time || ''));
    });
    return map;
  }, [calls, daysOfWeek]);

  const totalCallsThisWeek = Object.values(callsByDay).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-4">
      {/* Week navigation header */}
      <div className="flex items-center justify-between rounded-xl border bg-card px-5 py-4">
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(w => w - 1)} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-foreground">{weekLabel}</h2>
          <p className="text-sm text-muted-foreground">
            {totalCallsThisWeek} {totalCallsThisWeek === 1 ? 'call' : 'calls'} this week
            {weekOffset === 0 && ' (current week)'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setWeekOffset(w => w + 1)} className="gap-1">
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day-by-day list */}
      <div className="space-y-3">
        {daysOfWeek.map(day => {
          const key = format(day, "yyyy-MM-dd");
          const dayCalls = callsByDay[key] || [];
          const dayIsToday = isToday(day);
          const dayIsPast = day < new Date(new Date().toDateString()) && !dayIsToday;

          return (
            <div
              key={key}
              className={`rounded-xl border overflow-hidden transition-all ${
                dayIsToday ? 'border-primary/40 bg-primary/5' : dayIsPast ? 'opacity-50' : 'bg-card'
              }`}
            >
              {/* Day header */}
              <div className={`flex items-center justify-between px-5 py-3 ${
                dayIsToday ? 'bg-primary/10' : 'bg-muted/30'
              }`}>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-extrabold ${dayIsToday ? 'text-primary' : 'text-foreground'}`}>
                    {format(day, "d")}
                  </span>
                  <div>
                    <p className={`text-sm font-bold ${dayIsToday ? 'text-primary' : 'text-foreground'}`}>
                      {format(day, "EEEE")}
                      {dayIsToday && <span className="ml-2 text-xs font-medium bg-primary text-primary-foreground rounded-full px-2 py-0.5">Today</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{format(day, "MMMM d, yyyy")}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">
                  {dayCalls.length} {dayCalls.length === 1 ? 'call' : 'calls'}
                </span>
              </div>

              {/* Calls for this day */}
              {dayCalls.length === 0 ? (
                <div className="px-5 py-4 text-center">
                  <p className="text-sm text-muted-foreground/50">No calls scheduled</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {dayCalls.map(call => {
                    const timeLabel = formatTimeInUserTZ(call.call_date, call.call_time, call.timezone).replace(/ [A-Z]{3,4}$/, '');
                    const rsvpStatus = user?.id ? getDemoRsvpStatus(call.id, user.id) : null;
                    const dateObj = convertToUserTimezone(call.call_date, call.call_time, call.timezone);
                    const isLive = isToday(dateObj) && (() => {
                      if (!call.call_time) return false;
                      const [h, m] = call.call_time.split(":").map(Number);
                      const start = new Date(dateObj); start.setHours(h, m, 0, 0);
                      return Date.now() >= start.getTime() - 1800000 && Date.now() <= start.getTime() + 7200000;
                    })();

                    return (
                      <button
                        key={call.id}
                        onClick={() => onCallClick(call)}
                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/50 transition-colors text-left"
                      >
                        <div className={`flex items-center justify-center h-11 w-11 rounded-xl shrink-0 ${
                          isLive ? 'bg-emerald-500/15' : 'bg-cyan-500/10'
                        }`}>
                          {isLive ? <Play className="h-5 w-5 text-emerald-500" /> : <Video className="h-5 w-5 text-cyan-500" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-foreground">{call.title}</p>
                          <p className="text-sm text-muted-foreground">{timeLabel}</p>
                          {call.description && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{call.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {rsvpStatus === 'yes' && (
                            <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1">RSVP'd</span>
                          )}
                          {isLive && (
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 rounded-full px-2.5 py-1 animate-pulse">Live</span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Calendar() {
  const {
    calls,
    isLoading: callsLoading,
    deleteCall,
    deleteCallSeries
  } = useCalendarCalls();
  const {
    recordings,
    isLoading: recordingsLoading,
    deleteRecording
  } = useCallRecordings();
  const {
    isAdmin
  } = useAdminCheck();
  const { isCSM } = useRoleCheck();
  const canManageCalendar = isAdmin || isCSM;
  const {
    tierId,
    tierKey
  } = useUserTier();
  const isMobile = useIsMobile();
  const recordingIds = useMemo(() => recordings.map(r => r.id), [recordings]);
  const { data: fathomRecordingIds = [] } = useFathomNotesForRecordings(recordingIds);

  // Fetch upsell URL once at parent level
  const {
    data: upsellUrl
  } = useQuery({
    queryKey: ["tier-upsell-url", tierId],
    queryFn: async () => {
      if (!tierId) return null;
      const {
        data: tier
      } = await supabase.from("tiers").select("upsell_funnel_url").eq("id", tierId).maybeSingle();
      return tier?.upsell_funnel_url || null;
    },
    enabled: !!tierId && !canManageCalendar,
    staleTime: 5 * 60 * 1000
  });
  const [showCallCreateModal, setShowCallCreateModal] = useState(false);
  const [showCallEditModal, setShowCallEditModal] = useState(false);
  const [showRecordingCreateModal, setShowRecordingCreateModal] = useState(false);
  const [showRecordingEditModal, setShowRecordingEditModal] = useState(false);
  const [showCallDetailModal, setShowCallDetailModal] = useState(false);
  const [showRecordingDetailModal, setShowRecordingDetailModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [selectedRecording, setSelectedRecording] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter to only truly upcoming calls
  const upcomingCalls = useMemo(() => {
    return calls.filter(call => isCallUpcomingInUserTZ(call.call_date, call.call_time, call.timezone)).slice(0, 10);
  }, [calls]);

  // Group calls by date for timeline view
  const groupedCalls = useMemo(() => {
    const groups: Record<string, typeof upcomingCalls> = {};
    upcomingCalls.forEach(call => {
      const dateKey = getDateInUserTimezone(call.call_date, call.call_time, call.timezone);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(call);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [upcomingCalls]);
  // Fallback to demo recordings when Supabase has no data yet
  const displayRecordings = useMemo(
    () => (recordings.length > 0 ? recordings : DEMO_RECORDINGS),
    [recordings],
  );

  const filteredRecordings = useMemo(() => {
    if (!searchQuery) return displayRecordings;
    const query = searchQuery.toLowerCase();
    return displayRecordings.filter(
      r =>
        r.title.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.tags.some(tag => tag.toLowerCase().includes(query)),
    );
  }, [displayRecordings, searchQuery]);

  // Inner Circle is gated to Platinum + Diamond; staff/admin always see it.
  const canSeeInnerCircle =
    canManageCalendar || tierKey === 'platinum' || tierKey === 'diamond';
  return <div className="flex-1 overflow-y-auto bg-content" data-tour="calendar-view">
      {/* Gradient Section - wraps header and tabs list */}
      <GradientSection className="px-4 md:px-6 py-5" paddingBottom="0px">
        <MobileLogoHeader />

        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-6 relative">
          <div className="flex items-center justify-center h-16 w-16 md:h-20 md:w-20 rounded-full bg-primary/10 mb-4">
            <CalendarIcon className="h-8 w-8 md:h-10 md:w-10 text-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Calendar & Calls</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            View Upcoming Group Calls And Watch Past Replays
          </p>
          
          {/* Desktop Admin Buttons */}
           {canManageCalendar && !isMobile && <div className="absolute top-0 right-0 flex gap-2">
              <Button onClick={() => setShowCallCreateModal(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create New Call
              </Button>
              <Button onClick={() => setShowRecordingCreateModal(true)} variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Add Recording
              </Button>
            </div>}
        </div>

        {/* Tabs List - inside gradient section */}
        <div className="flex justify-center pb-3">
          <div className="bg-white/80 backdrop-blur-sm p-1 rounded-full shadow-sm border border-border/50 inline-flex" role="tablist" id="calendar-tabs">
            {/* These will be controlled by the Tabs component below */}
          </div>
        </div>
      </GradientSection>

      {/* Tabs Component wraps everything for state management */}
      <Tabs defaultValue="upcoming" className="-mt-[52px]">
        {/* TabsList positioned over the gradient */}
        <div className="flex justify-center relative z-10 pb-0 pt-0 mt-[31px] mb-[6px]">
          <TabsList className="bg-white/80 backdrop-blur-sm p-1 rounded-full shadow-sm border border-border/50">
            <TabsTrigger value="upcoming" className="rounded-full px-4 md:px-6 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#2D8F64] data-[state=active]:to-[#6EDAA6] data-[state=active]:text-white data-[state=active]:shadow-none">
              Upcoming Calls
            </TabsTrigger>
            <TabsTrigger value="recordings" className="rounded-full px-4 md:px-6 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#2D8F64] data-[state=active]:to-[#6EDAA6] data-[state=active]:text-white data-[state=active]:shadow-none">
              Call Recordings
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content - no gradient */}
        <div className="px-4 md:px-6 pb-24 md:pb-6">
          <TabsContent value="upcoming" className="space-y-4 mt-0">
            {/* Week list view -- replaces calendar grid */}
            <WeekListView
              calls={calls}
              onCallClick={(call) => {
                setSelectedCall(call);
                setShowCallDetailModal(true);
              }}
            />

            {canManageCalendar && <Alert className="text-xs md:text-sm">
                <Info className="h-4 w-4" />
                <AlertDescription>🔓 Staff View: You can see calls from all tiers</AlertDescription>
              </Alert>}

            {/* Mobile timeline view */}
            <div className="md:hidden">
              {callsLoading ? <p className="text-muted-foreground text-center py-8 text-sm">Loading...</p> : groupedCalls.length === 0 ? <p className="text-muted-foreground text-center py-8 text-sm">No upcoming calls</p> : <div className="space-y-6">
                  {groupedCalls.map(([date, dateCalls], groupIndex) => <div key={date} className="relative">
                      {groupIndex < groupedCalls.length - 1 && <div className="absolute left-[5px] top-8 bottom-0 w-0.5 bg-gradient-to-b from-[hsl(var(--primary))] to-[hsl(var(--primary-light))]" style={{
                  height: "calc(100% + 1.5rem)"
                }} />}

                      <DateGroupHeader dateStr={date} />

                      <div className="mt-4 ml-6 space-y-3">
                        {dateCalls.map(call => <CallCardRedesigned key={call.id} call={call} isAdmin={canManageCalendar} userTierId={tierId} upsellUrl={upsellUrl} onEdit={call => {
                    setSelectedCall(call);
                    setShowCallEditModal(true);
                  }} onDelete={deleteCall} onDeleteSeries={deleteCallSeries} onViewDetails={call => {
                    setSelectedCall(call);
                    setShowCallDetailModal(true);
                  }} />)}
                      </div>
                    </div>)}
                </div>}
            </div>
          </TabsContent>


          <TabsContent value="recordings" className="space-y-4 mt-0">
            {canManageCalendar && <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>🔓 Staff View: You can see recordings from all tiers</AlertDescription>
              </Alert>}

            <Input
              placeholder="Search recordings..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white"
            />

            {recordingsLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : filteredRecordings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recordings match that search</p>
            ) : (
              <RecordingsFolderView
                recordings={filteredRecordings}
                canSeeInnerCircle={canSeeInnerCircle}
                onRecordingClick={rec => {
                  setSelectedRecording(rec);
                  setShowRecordingDetailModal(true);
                }}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Mobile Admin Fixed Bottom Bar */}
      {canManageCalendar && isMobile && <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-0 right-0 p-3 bg-background border-t border-border flex gap-3 z-30 px-[8px]">
          <Button variant="outline" className="flex-1 text-sm" size="sm" onClick={() => setShowCallCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Call
          </Button>
          <Button variant="outline" className="flex-1 text-sm px-0" size="sm" onClick={() => setShowRecordingCreateModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Add Recording+
          </Button>
        </div>}

      {/* Modals */}
      <CallCreateModal open={showCallCreateModal} onOpenChange={setShowCallCreateModal} />
      <CallEditModal open={showCallEditModal} onOpenChange={setShowCallEditModal} call={selectedCall} />
      <RecordingCreateModal open={showRecordingCreateModal} onOpenChange={setShowRecordingCreateModal} />
      <RecordingEditModal open={showRecordingEditModal} onOpenChange={setShowRecordingEditModal} recording={selectedRecording} />
      {showCallDetailModal && selectedCall && <CalendarCallModal open={showCallDetailModal} onOpenChange={setShowCallDetailModal} call={selectedCall} isAdmin={canManageCalendar} userTierId={tierId} upsellUrl={upsellUrl} onEdit={call => {
      setSelectedCall(call);
      setShowCallDetailModal(false);
      setShowCallEditModal(true);
    }} />}
      <RecordingModal open={showRecordingDetailModal} onOpenChange={setShowRecordingDetailModal} recording={selectedRecording} isAdmin={canManageCalendar} onEdit={rec => {
      setSelectedRecording(rec);
      setShowRecordingDetailModal(false);
      setShowRecordingEditModal(true);
    }} onDelete={deleteRecording} />
    </div>;
}