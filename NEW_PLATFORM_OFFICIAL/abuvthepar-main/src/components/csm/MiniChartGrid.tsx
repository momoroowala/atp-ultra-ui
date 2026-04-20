import { motion } from 'framer-motion';
import { useAllCallRsvpCounts } from '@/hooks/useCallRsvp';

// ── Pure CSS bar helper ──
function CSSBar({ value, max, color, className = '' }: { value: number; max: number; color: string; className?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={`w-full rounded-full overflow-hidden ${className}`} style={{ height: 6, backgroundColor: 'hsl(var(--muted))' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// ── Card 1: Outreach Effectiveness ──
export function OutreachEffectivenessCard({ contactedCount, reEngagedFromOutreach }: { contactedCount: number; reEngagedFromOutreach: number }) {
  const pct = contactedCount > 0 ? Math.round((reEngagedFromOutreach / contactedCount) * 100) : -1;
  const color = pct < 0 ? 'hsl(var(--muted-foreground))' : pct <= 30 ? '#DC2626' : pct <= 60 ? '#F59E0B' : '#16A34A';

  return (
    <div className="bg-card rounded-lg border p-2.5 shadow-sm overflow-hidden flex flex-col h-full justify-between">
      <p className="text-[13px] font-semibold text-muted-foreground mb-1">📞 Outreach Effectiveness</p>
      {pct < 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-bold text-muted-foreground">—</p>
            <p className="text-[10px] text-muted-foreground">No outreach data yet</p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xl font-bold leading-none" style={{ color }}>{pct}%</p>
          <CSSBar value={pct} max={100} color={color} className="mt-1.5" />
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#16A34A' }} />
              <span className="text-[10px] text-muted-foreground">{contactedCount} Contacted</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#3B82F6' }} />
              <span className="text-[10px] text-muted-foreground">{reEngagedFromOutreach} Re-engaged</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Card 2: Weekly Activity Trend ──
export function WeeklyActivityCard({ wau }: { wau: number }) {
  return (
    <div className="bg-card rounded-lg border p-2.5 shadow-sm overflow-hidden flex flex-col h-full">
      <p className="text-[13px] font-semibold text-muted-foreground mb-1">📈 Weekly Activity Trend</p>
      <div className="flex items-baseline gap-2">
        <p className="text-xl font-bold leading-none">{wau}</p>
        <span className="text-[10px] font-medium text-muted-foreground">active users this week</span>
      </div>
      <div className="flex-1 flex items-center justify-center mt-2">
        <p className="text-[10px] text-muted-foreground">Daily breakdown not yet available</p>
      </div>
    </div>
  );
}

// ── Card 3: Course Bottleneck ──
export function CourseBottleneckCard({ stuckStudents, onClick }: { stuckStudents: number; onClick?: () => void }) {
  if (stuckStudents === 0) {
    return (
      <div className="bg-card rounded-lg border p-2.5 shadow-sm overflow-hidden flex flex-col items-center justify-center h-full">
        <p className="text-[13px] font-semibold text-muted-foreground mb-1">🚧 Course Bottleneck</p>
        <p className="text-sm font-medium">No bottlenecks detected 🎉</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-2.5 shadow-sm overflow-hidden flex flex-col h-full cursor-pointer hover:ring-1 hover:ring-primary/20 transition" onClick={onClick}>
      <p className="text-[13px] font-semibold text-muted-foreground mb-1">🚧 Course Bottleneck</p>
      <p className="text-lg font-bold leading-none">{stuckStudents} <span className="text-[10px] font-medium text-muted-foreground">students stuck</span></p>
      <div className="flex-1 flex items-center justify-center mt-2">
        <p className="text-[10px] text-muted-foreground">Click for details</p>
      </div>
    </div>
  );
}

// ── Card 4: Call Attendance ──
export function CallAttendanceCard({ onClick }: { onClick?: () => void }) {
  const { data: rsvpCounts } = useAllCallRsvpCounts();

  const calls = rsvpCounts ? Object.values(rsvpCounts) as { yes: number; no: number }[] : [];
  const totalYes = calls.reduce((sum, c) => sum + c.yes, 0);
  const totalNo = calls.reduce((sum, c) => sum + c.no, 0);
  const totalRsvps = totalYes + totalNo;
  const attendancePct = totalRsvps > 0 ? Math.round((totalYes / totalRsvps) * 100) : -1;
  const color = attendancePct < 0 ? 'hsl(var(--muted-foreground))' : attendancePct <= 40 ? '#DC2626' : attendancePct <= 70 ? '#F59E0B' : '#16A34A';

  return (
    <div className="bg-card rounded-lg border p-2.5 shadow-sm overflow-hidden flex flex-col h-full justify-between cursor-pointer hover:ring-1 hover:ring-primary/20 transition" onClick={onClick}>
      <p className="text-[13px] font-semibold text-muted-foreground mb-1">📅 Call Attendance</p>
      {attendancePct < 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-bold text-muted-foreground">—</p>
            <p className="text-[10px] text-muted-foreground">No RSVP data yet</p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xl font-bold leading-none" style={{ color }}>{attendancePct}%</p>
          <CSSBar value={attendancePct} max={100} color={color} className="mt-1.5" />
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#16A34A' }} />
              <span className="text-[10px] text-muted-foreground">{totalYes} Yes</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: '#DC2626' }} />
              <span className="text-[10px] text-muted-foreground">{totalNo} No</span>
            </div>
            <span className="text-[10px] text-muted-foreground ml-auto">{Object.keys(rsvpCounts || {}).length} calls</span>
          </div>
        </>
      )}
    </div>
  );
}

// ── Insight Cards (vertical stack for right column) ──
interface InsightCardsProps {
  contactedCount: number;
  reEngagedFromOutreach: number;
  wau: number;
  stuckStudents: number;
}

export function InsightCards({ contactedCount, reEngagedFromOutreach, wau, stuckStudents }: InsightCardsProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="flex flex-col gap-2">
      <OutreachEffectivenessCard contactedCount={contactedCount} reEngagedFromOutreach={reEngagedFromOutreach} />
      <WeeklyActivityCard wau={wau} />
      <CourseBottleneckCard stuckStudents={stuckStudents} />
      <CallAttendanceCard />
    </motion.div>
  );
}

// ── Tracking Row (Re-Engagement + Offboarding) ──
interface TrackingRowProps {
  reEngagedCount: number;
  offboardedCount: number;
  onReEngagementClick?: () => void;
  onOffboardingClick?: () => void;
}

export function TrackingRow({ reEngagedCount, offboardedCount, onReEngagementClick, onOffboardingClick }: TrackingRowProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex gap-2 h-full items-stretch">
      {/* Re-Engagement Tracking — 60% */}
      <div className="bg-card rounded-lg border shadow-sm flex flex-col min-h-[120px] h-full cursor-pointer hover:ring-1 hover:ring-primary/20 transition" style={{ flex: '0.6', padding: '10px 14px' }} onClick={onReEngagementClick}>
        {reEngagedCount === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[13px] font-semibold text-foreground mb-1.5">🔄 Re-Engagement Tracking</p>
              <p className="text-[11px] text-muted-foreground">No re-engagements yet</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[13px] font-semibold text-foreground mb-1.5 text-center w-full">🔄 Re-Engagement Tracking</p>
            <div className="flex justify-around w-full">
              <div className="flex flex-col items-center">
                <p className="text-[18px] font-bold leading-none text-foreground">{reEngagedCount}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">returned</p>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center mt-2">
              <p className="text-[10px] text-muted-foreground">Click for details</p>
            </div>
          </>
        )}
      </div>

      {/* Offboarding Tracking — 40% */}
      <div className="bg-card rounded-lg border shadow-sm flex flex-col min-h-[120px] h-full cursor-pointer hover:ring-1 hover:ring-primary/20 transition" style={{ flex: '0.4', padding: '10px 14px' }} onClick={onOffboardingClick}>
        <p className="text-[13px] font-semibold text-foreground mb-1.5 text-center w-full">📋 Offboarding Tracking</p>
        {offboardedCount === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[11px] text-muted-foreground">No offboarding data yet</p>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <p className="text-[18px] font-bold leading-none text-foreground">{offboardedCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">total</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
