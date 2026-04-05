import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { RecordingCardRedesigned } from "@/components/calendar/RecordingCardRedesigned";
import { DateGroupHeader } from "@/components/calendar/DateGroupHeader";
import { CallCreateModal } from "@/components/calendar/CallCreateModal";
import { CallEditModal } from "@/components/calendar/CallEditModal";
import { RecordingCreateModal } from "@/components/calendar/RecordingCreateModal";
import { RecordingEditModal } from "@/components/calendar/RecordingEditModal";
import { CalendarCallModal } from "@/components/calendar/CalendarCallModal";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { UpcomingCallsSidePanel } from "@/components/calendar/UpcomingCallsSidePanel";
import { RecordingModal } from "@/components/calendar/RecordingModal";
import { MobileLogoHeader } from "@/components/MobileLogoHeader";
import { GradientSection } from "@/components/GradientSection";
import { Plus, Upload, Info, Calendar as CalendarIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { subWeeks, subMonths } from "date-fns";
import { isCallUpcomingInUserTZ, getDateInUserTimezone } from "@/utils/timezoneHelpers";
import { useIsMobile } from "@/hooks/use-mobile";

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
    tierId
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
  const [dateFilter, setDateFilter] = useState("all");

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
  const filteredRecordings = useMemo(() => {
    let filtered = recordings;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => r.title.toLowerCase().includes(query) || r.description?.toLowerCase().includes(query) || r.tags.some(tag => tag.toLowerCase().includes(query)));
    }
    if (dateFilter !== "all") {
      const now = new Date();
      const cutoff = dateFilter === "week" ? subWeeks(now, 1) : dateFilter === "month" ? subMonths(now, 1) : subMonths(now, 3);
      filtered = filtered.filter(r => new Date(r.recorded_date) >= cutoff);
    }
    return filtered;
  }, [recordings, searchQuery, dateFilter]);
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
            <div className="flex flex-col md:flex-row gap-4">
              {/* Calendar Grid */}
              <div className="flex-1 min-w-0 md:w-[62%]">
                <CalendarGrid calls={calls} onCallClick={(call) => {
                  setSelectedCall(call);
                  setShowCallDetailModal(true);
                }} />
              </div>

              {/* Desktop Side Panel */}
              <div className="hidden md:block md:w-[38%] md:max-w-sm">
                <UpcomingCallsSidePanel
                  calls={upcomingCalls}
                  onCallClick={(call) => {
                    setSelectedCall(call);
                    setShowCallDetailModal(true);
                  }}
                />
              </div>
            </div>

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


          <TabsContent value="recordings" className="space-y-6 mt-0">
            {canManageCalendar && <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>🔓 Staff View: You can see recordings from all tiers</AlertDescription>
              </Alert>}

            <div className="flex flex-col sm:flex-row gap-3">
              <Input placeholder="Search recordings..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-1 bg-white" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="week">Past week</SelectItem>
                  <SelectItem value="month">Past month</SelectItem>
                  <SelectItem value="3months">Past 3 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recordingsLoading ? <p className="text-muted-foreground text-center py-8">Loading...</p> : filteredRecordings.length === 0 ? <p className="text-muted-foreground text-center py-8">No recordings found</p> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecordings.map(recording => <RecordingCardRedesigned key={recording.id} recording={recording} isAdmin={canManageCalendar} hasFathomNotes={fathomRecordingIds.includes(recording.id)} onEdit={rec => {
              setSelectedRecording(rec);
              setShowRecordingEditModal(true);
            }} onDelete={deleteRecording} onClick={rec => {
              setSelectedRecording(rec);
              setShowRecordingDetailModal(true);
            }} />)}
              </div>}
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