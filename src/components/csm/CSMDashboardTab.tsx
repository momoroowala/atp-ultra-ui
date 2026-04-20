import { useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Activity, Heart, AlertTriangle, Trophy, Eye, LayoutGrid, Columns3, PanelTop } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { motion, AnimatePresence } from 'framer-motion';
import { useAllUsersProgress } from '@/hooks/useAllUsersProgress';
import { useRoles } from '@/hooks/useRoles';
import { useCSMTickets } from '@/hooks/useCSMTickets';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useCSMMetrics, useCSMOutreachStatus, useMissedOnboarding } from '@/hooks/useCSMMetrics';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { useNavigate } from 'react-router-dom';

import {
  OutreachEffectivenessCard, TrackingRow, WeeklyActivityCard, CourseBottleneckCard, CallAttendanceCard,
  RevenueAtRiskCard, NPSScoreCard, FirstSaleConversionCard, CommunityEngagementCard, SummaryStatCard,
} from './MiniChartGrid';
import { CSMDashboardFilters, type CSMDashboardFilterValues } from './CSMDashboardFilters';
import { PriorityBanner } from './PriorityBanner';
import { CSMDetailDialog } from './CSMDetailDialog';
import { differenceInDays } from 'date-fns';

interface CSMDashboardTabProps {
  onNavigateToStudents?: () => void;
}

type LayoutConcept = 'A' | 'B' | 'C';

const LAYOUT_STORAGE_KEY = 'csm_dashboard_layout';

const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
};

function CountUpValue({ target }: { target: number }) {
  const animated = useCountUp(target);
  return <>{animated}</>;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(first: string, last: string) {
  return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
}

function hashColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

function getRiskPill(student: any): { label: string; className: string } {
  if (student.metricType === 'never_logged_in') {
    return { label: 'Never logged in', className: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' };
  }
  if (student.metricType === 'dead_on_arrival') {
    return { label: '0 progress', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' };
  }
  if (student.metricType === 'missed_onboarding') {
    return { label: 'Missed onboarding', className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' };
  }
  if (student.daysInactive && student.daysInactive >= 14) {
    return { label: `${student.daysInactive}d inactive`, className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' };
  }
  if (student.daysInactive) {
    return { label: `${student.daysInactive}d inactive`, className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' };
  }
  return { label: 'At risk', className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' };
}

/* ─────────────────────────────────────────────────────────
   Layout Selector
   ───────────────────────────────────────────────────────── */
function LayoutSelector({ value, onChange }: { value: LayoutConcept; onChange: (v: LayoutConcept) => void }) {
  const concepts: { key: LayoutConcept; label: string; icon: React.ReactNode; description: string }[] = [
    { key: 'A', label: 'Command Center', icon: <PanelTop className="h-3.5 w-3.5" />, description: 'Focused on attention queue' },
    { key: 'B', label: 'Balanced Overview', icon: <Columns3 className="h-3.5 w-3.5" />, description: 'Everything visible at once' },
    { key: 'C', label: 'Tabbed', icon: <LayoutGrid className="h-3.5 w-3.5" />, description: 'Cleanest, choose your focus' },
  ];

  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1 w-fit">
      <span className="text-xs text-muted-foreground px-2">Layout:</span>
      {concepts.map((c) => (
        <button
          key={c.key}
          onClick={() => onChange(c.key)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
            ${value === c.key
              ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }
          `}
          title={c.description}
        >
          {c.icon}
          <span className="hidden sm:inline">{c.label}</span>
          <span className="sm:hidden">
            {c.key}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Compact KPI Status Bar (used by Concepts A and C)
   ───────────────────────────────────────────────────────── */
function CompactKPIBar({
  totalUsers,
  wau,
  avgHealth,
  healthColor,
  healthDotColor,
  totalNeedsAttention,
  criticalCount,
  warningCount,
}: {
  totalUsers: number;
  wau: number;
  avgHealth: number;
  healthColor: string;
  healthDotColor: string;
  totalNeedsAttention: number;
  criticalCount: number;
  warningCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-6 px-4 py-2.5 bg-card rounded-lg border border-border/50 shadow-sm flex-wrap"
    >
      {/* Total Students */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <span className="text-sm font-bold text-foreground"><CountUpValue target={totalUsers} /></span>
        <span className="text-xs text-muted-foreground">Students</span>
      </div>

      <div className="w-px h-5 bg-border hidden sm:block" />

      {/* Active This Week */}
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-bold text-foreground"><CountUpValue target={wau} /></span>
        <span className="text-xs text-muted-foreground">Active</span>
        {totalUsers > 0 && (
          <span className="text-[10px] font-medium text-emerald-600">
            ({Math.round((wau / totalUsers) * 100)}%)
          </span>
        )}
      </div>

      <div className="w-px h-5 bg-border hidden sm:block" />

      {/* Avg Health */}
      <div className="flex items-center gap-2">
        <Heart className="h-4 w-4 text-violet-600" />
        <span className={`text-sm font-bold ${healthColor}`}><CountUpValue target={avgHealth} />%</span>
        <span className={`w-2 h-2 rounded-full ${healthDotColor}`} />
        <span className="text-xs text-muted-foreground">Health</span>
      </div>

      <div className="w-px h-5 bg-border hidden sm:block" />

      {/* Needs Attention */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <span className={`text-sm font-bold ${totalNeedsAttention > 0 ? 'text-amber-600' : 'text-foreground'}`}>
          <CountUpValue target={totalNeedsAttention} />
        </span>
        <span className="text-xs text-muted-foreground">Attention</span>
        {totalNeedsAttention > 0 && (
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />{criticalCount}
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />{warningCount}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Shared: Needs Attention Queue
   ───────────────────────────────────────────────────────── */
function NeedsAttentionQueue({
  students,
  activeFilter,
  setActiveFilter,
  navigate,
  maxHeight,
  interventionRef,
}: {
  students: any[];
  activeFilter: string | null;
  setActiveFilter: (v: string | null) => void;
  navigate: ReturnType<typeof useNavigate>;
  maxHeight?: string;
  interventionRef?: React.RefObject<HTMLDivElement>;
}) {
  return (
    <motion.div
      ref={interventionRef as any}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25 }}
      className="bg-card rounded-xl border shadow-sm flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <h3 className="text-sm font-semibold text-foreground">Needs Attention</h3>
          <span className="text-xs text-muted-foreground">({students.length})</span>
        </div>
        {activeFilter && (
          <button
            onClick={() => setActiveFilter(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      {students.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          All students are on track -- nice work!
        </div>
      ) : (
        <div className={`divide-y divide-border/50 ${maxHeight ? `overflow-y-auto` : ''}`} style={maxHeight ? { maxHeight } : undefined}>
          {students.map((s) => {
            const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.email;
            const initials = getInitials(s.firstName, s.lastName);
            const pill = getRiskPill(s);

            return (
              <div key={`${s.id}_${s.metricType}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ backgroundColor: hashColor(fullName) }}
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <span
                    className="cursor-pointer hover:underline font-medium text-sm text-foreground block truncate"
                    onClick={() => navigate('/csm-panel', { state: { viewStudentId: s.id, activeTab: 'students' } })}
                  >
                    {fullName}
                  </span>
                  {s.email && (
                    <p className="text-[11px] text-muted-foreground truncate">{s.email}</p>
                  )}
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap shrink-0 ${pill.className}`}>
                  {pill.label}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-7 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/csm-panel', { state: { viewStudentId: s.id, activeTab: 'students' } });
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Shared: Recent Wins Section
   ───────────────────────────────────────────────────────── */
function RecentWinsSection({ wins, navigate }: { wins: any[]; navigate: ReturnType<typeof useNavigate> }) {
  if (wins.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35 }}
      className="bg-card rounded-xl border shadow-sm"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-foreground">Recent Wins</h3>
      </div>
      <div className="divide-y divide-border/50">
        {wins.map((w) => {
          const fullName = `${w.firstName} ${w.lastName}`.trim();
          return (
            <div key={w.id} className="flex items-center gap-3 px-4 py-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: hashColor(fullName) }}
              >
                {getInitials(w.firstName, w.lastName)}
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className="cursor-pointer hover:underline font-medium text-sm text-foreground truncate block"
                  onClick={() => navigate('/csm-panel', { state: { viewStudentId: w.id, activeTab: 'students' } })}
                >
                  {fullName}
                </span>
                <p className="text-[11px] text-muted-foreground">{w.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Shared: Insight Cards with Category Tabs (2x2 per tab)
   ───────────────────────────────────────────────────────── */
type InsightTab = 'activity' | 'financial' | 'engagement';

interface InsightsGridTabbedProps {
  contactedCount: number;
  reEngagedCount: number;
  wau: number;
  setOpenDetail: (v: string | null) => void;
  metrics: ReturnType<typeof useCSMMetrics>;
}

function InsightsGridTabbed({
  contactedCount,
  reEngagedCount,
  wau,
  setOpenDetail,
  metrics,
}: InsightsGridTabbedProps) {
  const [tab, setTab] = useState<InsightTab>('activity');

  const tabs: { key: InsightTab; label: string }[] = [
    { key: 'activity', label: 'Activity' },
    { key: 'financial', label: 'Financial' },
    { key: 'engagement', label: 'Engagement' },
  ];

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;

  return (
    <div>
      <div className="flex items-center gap-1 mb-2 bg-muted/40 rounded-md p-0.5 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              tab === t.key
                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {tab === 'activity' && (
          <>
            <OutreachEffectivenessCard contactedCount={contactedCount} reEngagedFromOutreach={reEngagedCount} />
            <WeeklyActivityCard wau={wau} dailyActiveUsers={metrics.dailyActiveUsers} />
            <CourseBottleneckCard
              stuckStudents={metrics.stuckStudents}
              bottleneckPhase={metrics.bottleneckPhase}
              phaseDropOff={metrics.phaseDropOff}
              onClick={() => setOpenDetail('course_bottleneck')}
            />
            <CallAttendanceCard />
          </>
        )}
        {tab === 'financial' && (
          <>
            <RevenueAtRiskCard
              revenueAtRisk={metrics.revenueAtRisk}
              totalPortfolioValue={metrics.totalPortfolioValue}
              atRiskCount={metrics.atRisk.length + metrics.deadOnArrival.length}
              onClick={() => setOpenDetail('revenue_at_risk')}
            />
            <FirstSaleConversionCard
              conversionRate={metrics.firstSaleConversionRate}
              firstSaleCount={metrics.firstSaleCount}
              totalStudents={metrics.totalUsers}
              onClick={() => setOpenDetail('first_sale')}
            />
            <SummaryStatCard
              label="Portfolio Value"
              value={fmt(metrics.totalPortfolioValue)}
              subtitle="total active student revenue"
              color="text-emerald-600"
            />
            <SummaryStatCard
              label="Avg Student Revenue"
              value={fmt(metrics.avgStudentRevenue)}
              subtitle="per active student"
            />
          </>
        )}
        {tab === 'engagement' && (
          <>
            <NPSScoreCard
              npsScore={metrics.npsScore}
              npsBreakdown={metrics.npsBreakdown}
              onClick={() => setOpenDetail('nps_detail')}
            />
            <CommunityEngagementCard
              engagementRate={metrics.communityEngagementRate}
              onClick={() => setOpenDetail('community_engagement')}
            />
            <SummaryStatCard
              label="Avg Calendar Attendance"
              value={`${metrics.avgCalendarAttendance}%`}
              subtitle="across active students"
              color={metrics.avgCalendarAttendance >= 60 ? 'text-emerald-600' : metrics.avgCalendarAttendance >= 30 ? 'text-amber-600' : 'text-red-600'}
            />
            <SummaryStatCard
              label="Completion Velocity"
              value={`${metrics.avgCompletionVelocityDays}d`}
              subtitle="avg days per phase"
              color={metrics.avgCompletionVelocityDays <= 14 ? 'text-emerald-600' : metrics.avgCompletionVelocityDays <= 30 ? 'text-amber-600' : 'text-red-600'}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═════════════════════════════════════════════════════════ */
export function CSMDashboardTab({ onNavigateToStudents }: CSMDashboardTabProps) {
  const { user } = useAuth();
  const { isMegaAdmin } = useRoleCheck();
  const navigate = useNavigate();
  const { totalDmUnread } = useUnreadCounts();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [openDetail, setOpenDetail] = useState<string | null>(null);
  const interventionRef = useRef<HTMLDivElement>(null);

  // Layout concept state with localStorage persistence
  const [layout, setLayoutState] = useState<LayoutConcept>(() => {
    try {
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (stored === 'A' || stored === 'B' || stored === 'C') return stored;
    } catch { /* noop */ }
    return 'A';
  });

  const setLayout = useCallback((v: LayoutConcept) => {
    setLayoutState(v);
    try { localStorage.setItem(LAYOUT_STORAGE_KEY, v); } catch { /* noop */ }
  }, []);

  // Sub-tab state for Concept C
  const [conceptCTab, setConceptCTab] = useState<'queue' | 'insights' | 'wins'>('queue');

  const handleBannerCategoryClick = (key: string) => {
    setActiveFilter(key);
    interventionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const [filters, setFilters] = useState<CSMDashboardFilterValues>({
    userScope: 'all',
    tierFilter: 'all',
    csmFilter: isMegaAdmin ? 'all' : (user?.id || 'all'),
  });

  const isReadOnly = filters.csmFilter !== user?.id;

  const effectiveCsmFilter = filters.csmFilter === 'all' ? null : filters.csmFilter;
  const effectiveTierFilter = filters.tierFilter === 'all' ? [] : [filters.tierFilter];
  const effectiveStatusFilter = filters.userScope === 'active' ? 'active' : filters.userScope === 'inactive' ? 'inactive' : 'all';

  const { data: roles } = useRoles();
  const clientRoleId = roles?.find(r => r.role_key === 'client')?.id;

  const { data: usersData, isLoading: usersLoading } = useAllUsersProgress({
    perPage: 1000,
    roleFilter: clientRoleId || 'all',
    csmFilter: effectiveCsmFilter,
    tierFilter: effectiveTierFilter,
    statusFilter: effectiveStatusFilter,
    sortColumn: 'first_name',
    sortDirection: 'asc',
  });

  const { data: ticketsData, isLoading: ticketsLoading } = useCSMTickets(undefined, 'csm');
  const { data: outreachData, upsertStatus } = useCSMOutreachStatus();
  const { data: missedOnboardingData } = useMissedOnboarding();

  // Demo students fallback when Supabase returns empty
  const demoUsersData = useMemo(() => {
    if (usersData?.users && usersData.users.length > 0) return usersData;

    // Deterministic pseudo-random from index (no Math.random)
    const dseed = (i: number) => ((i * 2654435761) >>> 0) % 1000;

    const names = [
      ['Sarah','Chen'],['Marcus','Rivera'],['Jordan','Williams'],['Priya','Patel'],['Tyler','Brooks'],
      ['Aisha','Johnson'],['David','Kim'],['Emma','Thompson'],['Alex','Morgan'],['Nina','Sato'],
      ['Liam','Garcia'],['Sophia','Martinez'],['Ethan','Lee'],['Olivia','Brown'],['Mason','Taylor'],
      ['Isabella','Anderson'],['Logan','Thomas'],['Mia','Jackson'],['James','White'],['Ava','Wilson'],
      ['Benjamin','Harris'],['Charlotte','Clark'],['Jacob','Lewis'],['Amelia','Robinson'],['Michael','Walker'],
      ['Harper','Hall'],['Daniel','Allen'],['Evelyn','Young'],['Sebastian','King'],['Abigail','Wright'],
      ['Henry','Lopez'],['Emily','Hill'],['Owen','Scott'],['Ella','Green'],['Jack','Adams'],
      ['Scarlett','Baker'],['Lucas','Nelson'],['Grace','Carter'],['Aiden','Mitchell'],['Chloe','Roberts'],
      ['Samuel','Turner'],['Zoey','Phillips'],['Joseph','Campbell'],['Lily','Parker'],['John','Evans'],
      ['Hannah','Edwards'],['Ryan','Collins'],['Aria','Stewart'],['Luke','Morris'],['Riley','Murphy'],
    ];
    const tiers = ['Elite','Ultimate','Platinum','Elite','STB','Elite','Ultimate','STB','Platinum','STB','STB','STB','Elite','STB','STB','Ultimate','STB','Elite','STB','Platinum','STB','STB','Elite','STB','Ultimate','STB','STB','Elite','STB','STB','STB','Elite','STB','STB','Ultimate','STB','STB','Elite','STB','STB','STB','Elite','STB','STB','STB','STB','Elite','STB','STB','STB'];
    const phaseNames = ['Product Research', 'Sourcing', 'Listing & Launch', 'Scale & Optimize'];
    const tierRevenue: Record<string, [number, number]> = {
      STB: [0, 5000], Elite: [2000, 12000], Ultimate: [5000, 25000], Platinum: [10000, 50000],
    };
    const now = Date.now();
    const day = 86400000;
    const totalTasks = 24;

    const users = names.map(([fn, ln], i) => {
      const s = dseed(i);
      const s2 = dseed(i + 100);
      const s3 = dseed(i + 200);

      // Activity tiers: 0-4 stars, 5-14 solid, 15-29 nudge, 30-39 at-risk, 40-49 DOA/never
      const daysAgo = i < 5 ? (s % 2) : i < 15 ? (s % 6) + 1 : i < 30 ? 7 + (s % 18) : i < 40 ? 14 + (s % 50) : null;
      const lastSignInAt = daysAgo !== null ? new Date(now - daysAgo * day).toISOString() : null;

      // Progress follows activity tiers
      const progress = i < 5 ? 60 + (s % 36) : i < 15 ? 30 + (s % 35) : i < 30 ? 8 + (s % 25) : i < 40 ? (s % 12) : 0;

      const completedTasks = Math.round(totalTasks * progress / 100);
      const currentPhase = progress >= 75 ? 4 : progress >= 50 ? 3 : progress >= 25 ? 2 : 1;
      const tier = tiers[i] || 'STB';
      const [revMin, revMax] = tierRevenue[tier] || [0, 5000];
      const revenue = Math.round(revMin + (s2 / 1000) * (revMax - revMin));
      const joinedDate = new Date(now - (30 + (s % 90)) * day).toISOString();
      const isActive = daysAgo !== null && daysAgo < 30;

      // NPS: stars 9-10, solid 7-8, nudge 5-7, at-risk 2-5, DOA null
      const npsScore = i < 5 ? 9 + (s % 2) : i < 15 ? 7 + (s % 2) : i < 30 ? 5 + (s % 3) : i < 40 ? 2 + (s % 4) : null;

      // Community: stars 10-30, solid 3-15, nudge 0-5, at-risk 0-1, DOA 0
      const communityPostCount = i < 5 ? 10 + (s2 % 21) : i < 15 ? 3 + (s2 % 13) : i < 30 ? (s2 % 6) : i < 40 ? (s2 % 2) : 0;

      // Calendar attendance: stars 80-100, solid 50-90, nudge 10-50, at-risk 0-20, DOA 0
      const calendarAttendance = i < 5 ? 80 + (s3 % 21) : i < 15 ? 50 + (s3 % 41) : i < 30 ? 10 + (s3 % 41) : i < 40 ? (s3 % 21) : 0;

      // Support tickets: inversely correlated with progress
      const supportTicketCount = i < 5 ? (s3 % 2) : i < 15 ? (s3 % 3) : i < 30 ? 1 + (s3 % 3) : i < 40 ? 2 + (s3 % 4) : 0;

      // First sale: only top performers (0-9) and some solid (10-14)
      const hasFirstSale = i < 5 || (i < 12 && s2 % 3 === 0);
      const firstSaleDate = hasFirstSale ? new Date(now - (5 + (s % 30)) * day).toISOString() : null;
      const firstSaleAmount = hasFirstSale ? 50 + (s2 % 1951) : null;

      // Cohort week: distributed across 8 weeks
      const cohortWeek = 1 + (i % 8);

      // Overdue tasks for at-risk students
      const overdueTasks = i < 15 ? 0 : i < 30 ? (s % 3) : i < 40 ? 1 + (s % 3) : 0;

      return {
        id: `demo-student-${i}`,
        firstName: fn,
        lastName: ln,
        email: `${fn.toLowerCase()}@student.dev`,
        lastSignInAt,
        progressPercentage: progress,
        tier,
        isActive,
        daysInactive: daysAgo !== null ? daysAgo : undefined,
        completedTasks,
        totalTasks,
        revenue,
        joinedDate,
        currentPhase,
        currentPhaseName: phaseNames[currentPhase - 1],
        npsScore,
        communityPostCount,
        calendarAttendance,
        supportTicketCount,
        firstSaleDate,
        firstSaleAmount,
        cohortWeek,
        overdueTasks,
      };
    });

    // Seed demo RSVP data for Call Attendance card (once)
    if (!localStorage.getItem('demo_call_rsvps_seeded')) {
      const rsvps: Record<string, Record<string, 'yes' | 'no'>> = {};
      ['demo-call-weekly-1','demo-call-weekly-2','demo-call-weekly-3','demo-call-qa-1','demo-call-qa-2'].forEach((callId, ci) => {
        rsvps[callId] = {};
        users.forEach((u, ui) => {
          const r = dseed(ui * 5 + ci + 300);
          if (r % 100 < 70) {
            rsvps[callId][u.id] = r % 100 < 50 ? 'yes' : 'no';
          }
        });
      });
      localStorage.setItem('demo_call_rsvps', JSON.stringify(rsvps));
      localStorage.setItem('demo_call_rsvps_seeded', '1');
    }

    return { users, totalCount: users.length };
  }, [usersData]);

  const students = demoUsersData?.users || [];
  const activeMissedOnboarding = missedOnboardingData || [];
  const metrics = useCSMMetrics(demoUsersData);

  const outreachMap = useMemo(() => {
    const map: Record<string, string> = {};
    (outreachData || []).forEach((o: any) => {
      map[`${o.user_id}_${o.metric_type}`] = o.status;
    });
    return map;
  }, [outreachData]);

  const handleStatusChange = useCallback(async (userId: string, metricType: string, status: string) => {
    await upsertStatus(userId, metricType, status);
  }, [upsertStatus]);

  // Demo outreach: students inactive 7+ days = "contacted", those who came back within 3 days = "re-engaged"
  const demoOutreach = useMemo(() => {
    const now = new Date();
    const contacted = students.filter((s: any) => {
      if (!s.lastSignInAt) return false;
      return differenceInDays(now, new Date(s.lastSignInAt)) >= 7;
    });
    const reEngagedFromOutreach = students.filter((s: any) => {
      if (!s.lastSignInAt) return false;
      const d = differenceInDays(now, new Date(s.lastSignInAt));
      return d >= 0 && d <= 3 && (s.progressPercentage || 0) > 0 && (s.progressPercentage || 0) < 40;
    });
    return { contactedCount: contacted.length, reEngagedFromOutreach: reEngagedFromOutreach.length };
  }, [students]);

  const contactedCount = useMemo(() => {
    const pendingStatuses = new Set(['follow_up_required', 'no_action']);
    const fromOutreach = Object.values(outreachMap).filter(s => s && !pendingStatuses.has(s)).length;
    // Use demo outreach data when no real outreach exists
    return fromOutreach > 0 ? fromOutreach : demoOutreach.contactedCount;
  }, [outreachMap, demoOutreach]);

  const reEngagedFromOutreach = useMemo(() => {
    const fromOutreach = Object.values(outreachMap).filter(s => s === 'resolved').length;
    return fromOutreach > 0 ? fromOutreach : demoOutreach.reEngagedFromOutreach;
  }, [outreachMap, demoOutreach]);

  const userLookup = useMemo(() => {
    const map: Record<string, { firstName: string; lastName: string }> = {};
    students.forEach((s: any) => {
      map[s.id] = { firstName: s.firstName || '', lastName: s.lastName || '' };
    });
    return map;
  }, [students]);

  const needsAttentionStudents = useMemo(() => {
    const items: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      metricType: string;
      daysInactive?: number;
      lastSignInAt?: string | null;
      sortPriority: number;
    }> = [];

    metrics.neverLoggedIn.forEach((s: any) => {
      items.push({ ...s, metricType: 'never_logged_in', lastSignInAt: null, daysInactive: undefined, sortPriority: 0 });
    });
    metrics.deadOnArrival.forEach((s: any) => {
      items.push({ ...s, metricType: 'dead_on_arrival', daysInactive: undefined, sortPriority: 1 });
    });
    activeMissedOnboarding.forEach((e: any) => {
      const profile = userLookup[e.user_id] || { firstName: e.user_email?.split('@')[0] || 'Unknown', lastName: '' };
      items.push({
        id: e.user_id || e.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: e.user_email,
        metricType: 'missed_onboarding',
        lastSignInAt: null,
        daysInactive: undefined,
        sortPriority: 2,
      });
    });
    metrics.atRisk.forEach((s: any) => {
      items.push({ ...s, metricType: 'at_risk', sortPriority: 3 });
    });

    items.sort((a, b) => {
      if (a.sortPriority !== b.sortPriority) return a.sortPriority - b.sortPriority;
      return (b.daysInactive || 0) - (a.daysInactive || 0);
    });

    return items;
  }, [metrics, activeMissedOnboarding, userLookup]);

  const recentWins = useMemo(() => {
    const wins: Array<{ id: string; firstName: string; lastName: string; description: string }> = [];
    students
      .filter((s: any) => s.progressPercentage >= 100)
      .slice(0, 2)
      .forEach((s: any) => {
        wins.push({
          id: s.id,
          firstName: s.firstName || '',
          lastName: s.lastName || '',
          description: 'Completed the course!',
        });
      });
    metrics.reEngaged.slice(0, 4 - wins.length).forEach((s: any) => {
      wins.push({
        id: s.id,
        firstName: s.firstName || '',
        lastName: s.lastName || '',
        description: `Re-engaged at ${s.progress}% progress`,
      });
    });
    return wins.slice(0, 4);
  }, [students, metrics.reEngaged]);

  const isLoading = usersLoading || ticketsLoading;

  const avgHealth = metrics.avgProgress;
  const healthColor = avgHealth >= 60 ? 'text-emerald-600' : avgHealth >= 30 ? 'text-amber-600' : 'text-red-600';
  const healthDotColor = avgHealth >= 60 ? 'bg-emerald-500' : avgHealth >= 30 ? 'bg-amber-500' : 'bg-red-500';

  const criticalCount = metrics.neverLoggedIn.length + metrics.deadOnArrival.length;
  const warningCount = metrics.atRisk.length + activeMissedOnboarding.length;
  const totalNeedsAttention = criticalCount + warningCount;

  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Shared KPI props for compact bar
  const kpiBarProps = {
    totalUsers: metrics.totalUsers,
    wau: metrics.wau,
    avgHealth,
    healthColor,
    healthDotColor,
    totalNeedsAttention,
    criticalCount,
    warningCount,
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <CSMDashboardFilters values={filters} onChange={setFilters} currentUserId={user?.id} />

      {/* Notification counts are now shown in the tab badges -- no banner needed */}

      {/* Conditional content: loading / empty / dashboard */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border/50 shadow-sm p-5 space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
          <div className="bg-card rounded-xl border shadow-sm p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-20" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ) : metrics.totalUsers === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No students assigned yet</p>
            <p className="text-sm">Students assigned to you will appear here with analytics.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Greeting + Layout Selector row */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <p className="text-lg font-semibold text-foreground">{getGreeting()}</p>
              <p className="text-sm text-muted-foreground">{todayFormatted}</p>
            </motion.div>

            <LayoutSelector value={layout} onChange={setLayout} />
          </div>

          {/* Layout content with animated transitions */}
          <AnimatePresence mode="wait">
            {layout === 'A' && (
              <motion.div
                key="layout-a"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* ─── CONCEPT A: "Command Center" ─── */}
                {/* Compact KPI status bar */}
                <CompactKPIBar {...kpiBarProps} />

                {/* Full-width attention queue (hero) */}
                <NeedsAttentionQueue
                  students={needsAttentionStudents}
                  activeFilter={activeFilter}
                  setActiveFilter={setActiveFilter}
                  navigate={navigate}
                  interventionRef={interventionRef}
                />

                {/* Two-column: Recent Wins + Insights 2x2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-4">
                    <RecentWinsSection wins={recentWins} navigate={navigate} />
                    <TrackingRow
                      reEngagedCount={metrics.reEngagedCount}
                      offboardedCount={metrics.offboardedCount}
                      onReEngagementClick={() => setOpenDetail('re_engagement')}
                      onOffboardingClick={() => setOpenDetail('offboarding')}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Today's Insights</h3>
                    <InsightsGridTabbed
                      contactedCount={contactedCount}
                      reEngagedCount={reEngagedFromOutreach}
                      wau={metrics.wau}
                      setOpenDetail={setOpenDetail}
                      metrics={metrics}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {layout === 'B' && (
              <motion.div
                key="layout-b"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* ─── CONCEPT B: "Balanced Overview" ─── */}
                {/* 4 KPI cards in a single row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <motion.div custom={0} initial="hidden" animate="visible" variants={fadeIn}>
                    <div className="bg-card rounded-xl border border-border/50 shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <p className="text-xs text-muted-foreground font-medium">Total Students</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        <CountUpValue target={metrics.totalUsers} />
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">enrolled in your cohort</p>
                    </div>
                  </motion.div>

                  <motion.div custom={1} initial="hidden" animate="visible" variants={fadeIn}>
                    <div className="bg-card rounded-xl border border-border/50 shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Activity className="h-3.5 w-3.5 text-emerald-600" />
                        <p className="text-xs text-muted-foreground font-medium">Active This Week</p>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-foreground">
                          <CountUpValue target={metrics.wau} />
                        </p>
                        {metrics.totalUsers > 0 && (
                          <span className="text-[10px] font-medium text-emerald-600">
                            {Math.round((metrics.wau / metrics.totalUsers) * 100)}%
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">7-day active</p>
                    </div>
                  </motion.div>

                  <motion.div custom={2} initial="hidden" animate="visible" variants={fadeIn}>
                    <div className="bg-card rounded-xl border border-border/50 shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Heart className="h-3.5 w-3.5 text-violet-600" />
                        <p className="text-xs text-muted-foreground font-medium">Avg Health</p>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className={`text-2xl font-bold ${healthColor}`}>
                          <CountUpValue target={avgHealth} />%
                        </p>
                        <span className={`w-2 h-2 rounded-full ${healthDotColor}`} />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">average progress</p>
                    </div>
                  </motion.div>

                  <motion.div custom={3} initial="hidden" animate="visible" variants={fadeIn}>
                    <div className="bg-card rounded-xl border border-border/50 shadow-sm p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        <p className="text-xs text-muted-foreground font-medium">Needs Attention</p>
                      </div>
                      <p className={`text-2xl font-bold ${totalNeedsAttention > 0 ? 'text-amber-600' : 'text-foreground'}`}>
                        <CountUpValue target={totalNeedsAttention} />
                      </p>
                      {totalNeedsAttention > 0 ? (
                        <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                            {criticalCount} critical
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                            {warningCount} warning
                          </span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-muted-foreground mt-0.5">all on track</p>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Three-column layout: Queue (40%) | Insights (30%) | Wins+Tracking (30%) */}
                <div ref={interventionRef} className="flex flex-col lg:grid lg:grid-cols-[4fr_3fr_3fr] gap-4">
                  {/* Col 1: Attention Queue with scroll */}
                  <NeedsAttentionQueue
                    students={needsAttentionStudents}
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    navigate={navigate}
                    maxHeight="480px"
                  />

                  {/* Col 2: Today's Insights with tabs */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Today's Insights</h3>
                    <InsightsGridTabbed
                      contactedCount={contactedCount}
                      reEngagedCount={reEngagedFromOutreach}
                      wau={metrics.wau}
                      setOpenDetail={setOpenDetail}
                      metrics={metrics}
                    />
                  </div>

                  {/* Col 3: Recent Wins + Tracking */}
                  <div className="flex flex-col gap-4">
                    <RecentWinsSection wins={recentWins} navigate={navigate} />
                    <TrackingRow
                      reEngagedCount={metrics.reEngagedCount}
                      offboardedCount={metrics.offboardedCount}
                      onReEngagementClick={() => setOpenDetail('re_engagement')}
                      onOffboardingClick={() => setOpenDetail('offboarding')}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {layout === 'C' && (
              <motion.div
                key="layout-c"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* ─── CONCEPT C: "Tabs Within Dashboard" ─── */}
                {/* Compact KPI status bar */}
                <CompactKPIBar {...kpiBarProps} />

                {/* Sub-tabs */}
                <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1 w-fit">
                  {([
                    { key: 'queue' as const, label: 'Attention Queue', count: needsAttentionStudents.length, color: 'red' },
                    { key: 'insights' as const, label: 'Insights', count: 0, color: 'blue' },
                    { key: 'wins' as const, label: 'Wins & Tracking', count: recentWins.length, color: 'emerald' },
                  ]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setConceptCTab(tab.key)}
                      className={`
                        relative px-4 py-2 rounded-md text-sm font-medium transition-all
                        ${conceptCTab === tab.key
                          ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                        }
                      `}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`absolute -top-1.5 -right-1 z-10 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1 ${
                          tab.color === 'red'
                            ? 'bg-red-500 text-white'
                            : tab.color === 'emerald'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-blue-500 text-white'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  {conceptCTab === 'queue' && (
                    <motion.div
                      key="tab-queue"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <NeedsAttentionQueue
                        students={needsAttentionStudents}
                        activeFilter={activeFilter}
                        setActiveFilter={setActiveFilter}
                        navigate={navigate}
                        interventionRef={interventionRef}
                      />
                    </motion.div>
                  )}

                  {conceptCTab === 'insights' && (
                    <motion.div
                      key="tab-insights"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Today's Insights</h3>
                        <InsightsGridTabbed
                          contactedCount={contactedCount}
                          reEngagedCount={reEngagedFromOutreach}
                          wau={metrics.wau}
                          setOpenDetail={setOpenDetail}
                          metrics={metrics}
                        />
                      </div>
                    </motion.div>
                  )}

                  {conceptCTab === 'wins' && (
                    <motion.div
                      key="tab-wins"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="space-y-4">
                        <RecentWinsSection wins={recentWins} navigate={navigate} />
                        <TrackingRow
                          reEngagedCount={metrics.reEngagedCount}
                          offboardedCount={metrics.offboardedCount}
                          onReEngagementClick={() => setOpenDetail('re_engagement')}
                          onOffboardingClick={() => setOpenDetail('offboarding')}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          <CSMDetailDialog openDetail={openDetail} onClose={() => setOpenDetail(null)} readOnly={isReadOnly} metrics={metrics} />
        </>
      )}
    </div>
  );
}
