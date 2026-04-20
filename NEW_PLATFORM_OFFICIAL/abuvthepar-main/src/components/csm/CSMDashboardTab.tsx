import { useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Activity, TrendingUp, GraduationCap, BarChart3, Clock, Layers, CheckCircle2, Trophy, Flame, Star, ClipboardList } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { motion } from 'framer-motion';
import { useAllUsersProgress } from '@/hooks/useAllUsersProgress';
import { useRoles } from '@/hooks/useRoles';
import { useCSMTickets } from '@/hooks/useCSMTickets';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useCSMMetrics, useCSMOutreachStatus, useMissedOnboarding, useCSMInsightMetrics } from '@/hooks/useCSMMetrics';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { InterventionCardsRow } from './InterventionCards';
import { FollowUpQueue } from './FollowUpQueue';
import { OutreachEffectivenessCard, TrackingRow, WeeklyActivityCard, CourseBottleneckCard } from './MiniChartGrid';
import { CSMDashboardFilters, type CSMDashboardFilterValues } from './CSMDashboardFilters';
import { CSMDetailDialog } from './CSMDetailDialog';
import { CSMToDoTab } from './CSMToDoTab';
import { useAllActionItems } from '@/hooks/useAllActionItems';

interface CSMDashboardTabProps {
  onNavigateToStudents?: () => void;
}

const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
};

function CountUpValue({ target }: { target: number }) {
  const animated = useCountUp(target);
  return <>{animated}</>;
}

export function CSMDashboardTab({ onNavigateToStudents }: CSMDashboardTabProps) {
  const { user } = useAuth();
  const { isMegaAdmin } = useRoleCheck();
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [openDetail, setOpenDetail] = useState<string | null>(null);
  const interventionRef = useRef<HTMLDivElement>(null);
  const { data: allActionItems = [] } = useAllActionItems();
  const pendingActionItemsCount = allActionItems.filter(i => !i.is_completed).length;

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
    enabled: !!clientRoleId,
  });

  const { data: ticketsData, isLoading: ticketsLoading } = useCSMTickets(undefined, 'csm');
  const { data: outreachData, upsertStatus } = useCSMOutreachStatus();
  const { data: missedOnboardingData } = useMissedOnboarding();
  const { data: insightMetrics } = useCSMInsightMetrics();

  const students = usersData?.users || [];
  const activeMissedOnboarding = missedOnboardingData || [];
  const metrics = useCSMMetrics(usersData);

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

  const pendingByType = useMemo(() => {
    const counts: Record<string, number> = {};
    const allStudents = [
      ...metrics.neverLoggedIn.map(s => ({ ...s, type: 'never_logged_in' })),
      ...metrics.deadOnArrival.map(s => ({ ...s, type: 'dead_on_arrival' })),
      ...metrics.atRisk.map(s => ({ ...s, type: 'at_risk' })),
    ];
    allStudents.forEach(s => {
      const status = outreachMap[`${s.id}_${s.type}`] || 'follow_up_required';
      if (status === 'follow_up_required') {
        counts[s.type] = (counts[s.type] || 0) + 1;
      }
    });
    const missedCount = activeMissedOnboarding.filter((e: any) => {
      const status = outreachMap[`${e.user_id}_missed_onboarding`];
      return !status || status === 'follow_up_required';
    }).length;
    if (missedCount > 0) counts['missed_onboarding'] = missedCount;
    return counts;
  }, [metrics, outreachMap, activeMissedOnboarding]);

  const reEngagedFromOutreachCount = useMemo(() => {
    const contactedIds = new Set<string>();
    (outreachData || []).forEach((o: any) => {
      if (o.status === 'contacted') {
        contactedIds.add(o.user_id);
      }
    });
    return (metrics.reEngaged || []).filter((s: any) => contactedIds.has(s.id)).length;
  }, [metrics.reEngaged, outreachData]);

  const userLookup = useMemo(() => {
    const map: Record<string, { firstName: string; lastName: string }> = {};
    students.forEach((s: any) => {
      map[s.id] = { firstName: s.firstName || '', lastName: s.lastName || '' };
    });
    return map;
  }, [students]);

  const queueStudents = useMemo(() => {
    const items: Array<{ id: string; firstName: string; lastName: string; email: string; context: string; metricType: string; lastSignInAt?: string | null; completedTasks?: number; assignedCsmName?: string }> = [];
    const shouldShow = (type: string) => !activeFilter || activeFilter === type;

    if (shouldShow('never_logged_in')) {
      metrics.neverLoggedIn.forEach((s: any) => {
        items.push({ ...s, context: `Joined ${new Date(s.joinedDate).toLocaleDateString()}`, metricType: 'never_logged_in', lastSignInAt: null, completedTasks: 0 });
      });
    }
    if (shouldShow('dead_on_arrival')) {
      metrics.deadOnArrival.forEach((s: any) => {
        items.push({ ...s, context: 'Logged in, 0 progress', metricType: 'dead_on_arrival', lastSignInAt: s.lastSignInAt || null, completedTasks: 0 });
      });
    }
    if (shouldShow('at_risk')) {
      metrics.atRisk.forEach((s: any) => {
        items.push({ ...s, context: `${s.daysInactive}d inactive, ${s.progress}% done`, metricType: 'at_risk', lastSignInAt: s.lastSignInAt || null, completedTasks: s.completedTasks || 0 });
      });
    }
    if (shouldShow('missed_onboarding')) {
      activeMissedOnboarding.forEach((e: any) => {
        const profile = userLookup[e.user_id] || { firstName: e.user_email?.split('@')[0] || 'Unknown', lastName: '' };
        items.push({
          id: e.user_id || e.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: e.user_email,
          context: `Missed call ${new Date(e.scheduled_call_time).toLocaleDateString()}`,
          metricType: 'missed_onboarding',
          lastSignInAt: null,
          completedTasks: 0,
        });
      });
    }
    return items;
  }, [activeFilter, metrics, activeMissedOnboarding, userLookup]);

  const pendingStudentCount = useMemo(() => {
    const uniquePending = new Set<string>();
    queueStudents.forEach(s => {
      const status = outreachMap[`${s.id}_${s.metricType}`] || 'follow_up_required';
      if (status !== 'contacted') {
        uniquePending.add(s.id);
      }
    });
    return uniquePending.size;
  }, [queueStudents, outreachMap]);

  const filteredContactedCount = useMemo(() => {
    const contactedInQueue = new Set<string>();
    queueStudents.forEach(s => {
      if (outreachMap[`${s.id}_${s.metricType}`] === 'contacted') {
        contactedInQueue.add(s.id);
      }
    });
    return contactedInQueue.size;
  }, [queueStudents, outreachMap]);

  const isLoading = usersLoading || ticketsLoading;

  const wauEngagement = metrics.totalUsers > 0 ? Math.round((metrics.wau / metrics.totalUsers) * 100) : 0;
  const mauEngagement = metrics.totalUsers > 0 ? Math.round((metrics.mau / metrics.totalUsers) * 100) : 0;

  const totalAttention = metrics.neverLoggedIn.length + metrics.deadOnArrival.length + metrics.atRisk.length + activeMissedOnboarding.length;

  const kpis = [
    { label: 'Total Users', value: metrics.totalUsers, icon: Users, color: 'text-primary', subtitle: <span className="text-[9px] text-muted-foreground">{metrics.totalUsers} students</span>, isNumber: true },
    { label: 'WAU (7d)', value: metrics.wau, icon: Activity, color: 'text-emerald-600', subtitle: <span className="text-[9px] text-muted-foreground">{wauEngagement}% engagement</span>, isNumber: true },
    { label: 'MAU (30d)', value: metrics.mau, icon: BarChart3, color: 'text-blue-600', subtitle: <span className="text-[9px] text-muted-foreground">{mauEngagement}% engagement</span>, isNumber: true },
    { label: 'Completion', value: metrics.courseCompletionPercent, icon: GraduationCap, color: 'text-violet-600', isPercent: true, subtitle: <span className="text-[9px] text-muted-foreground">{metrics.totalUsers} students</span> },
    { label: 'Avg Progress', value: metrics.avgProgress, icon: TrendingUp, color: 'text-primary', isPercent: true, subtitle: <span className="text-[9px] text-muted-foreground">across all courses</span> },
  ];

  const interventionProps = {
    neverLoggedInCount: metrics.neverLoggedIn.length,
    doaCount: metrics.deadOnArrival.length,
    atRiskCount: metrics.atRisk.length,
    missedOnboardingCount: activeMissedOnboarding.length,
    pendingByType,
    activeFilter,
    onFilterChange: setActiveFilter,
    neverLoggedInStudents: metrics.neverLoggedIn,
    doaStudents: metrics.deadOnArrival,
    atRiskStudents: metrics.atRisk,
    missedOnboardingStudents: activeMissedOnboarding.map((e: any) => {
      const profile = userLookup[e.user_id] || { firstName: e.user_email?.split('@')[0] || 'Unknown', lastName: '' };
      return {
        id: e.user_id || e.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: e.user_email,
        lastSignInAt: undefined,
      };
    }),
    outreachMap,
    onStatusChange: handleStatusChange,
    readOnly: isReadOnly,
  };

  return (
    <div className="space-y-1.5">
      <CSMDashboardFilters values={filters} onChange={setFilters} currentUserId={user?.id} />

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border p-2.5 shadow-sm space-y-2">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-3.5 w-3.5 rounded" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-10" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg border-l-[3px] border-l-muted p-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-2.5 w-20" />
                    <Skeleton className="h-5 w-8" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16 rounded-full" />
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
          {/* KPI Strip — unchanged */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {kpis.map((kpi, i) => (
              <motion.div key={kpi.label} custom={i} initial="hidden" animate="visible" variants={fadeIn}>
                <div className="bg-card rounded-lg border shadow-sm h-[90px] grid grid-rows-[auto_1fr_auto] items-center justify-items-center text-center px-3 py-2.5">
                  <div className="flex items-center justify-center gap-1.5 pt-0.5">
                    <kpi.icon className={`h-3.5 w-3.5 ${kpi.color} shrink-0`} />
                    <p className="text-[11px] text-muted-foreground font-medium truncate">{kpi.label}</p>
                  </div>
                  <p className="font-bold self-center text-center w-full" style={{ fontSize: '26px', lineHeight: 1.1 }}>
                    {'isNumber' in kpi && kpi.isNumber ? (
                      <CountUpValue target={kpi.value as number} />
                    ) : 'isPercent' in kpi && kpi.isPercent ? (
                      <><CountUpValue target={kpi.value as number} />%</>
                    ) : (
                      kpi.value
                    )}
                  </p>
                  <div className="text-[11px] text-muted-foreground text-center w-full min-h-[16px]">
                    {'subtitle' in kpi && kpi.subtitle ? kpi.subtitle : <span>&nbsp;</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Sub-tabs */}
          <Tabs defaultValue="attention" className="mt-2">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="attention" className="text-xs gap-1.5">
                Attention Queue
                {totalAttention > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-destructive/15 text-destructive text-[10px] font-bold min-w-[18px] h-[18px] px-1">
                    {totalAttention}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
              <TabsTrigger value="wins" className="text-xs">Wins & Tracking</TabsTrigger>
              <TabsTrigger value="todo" className="text-xs gap-1.5">
                <ClipboardList className="h-3 w-3" />
                To Do
                {pendingActionItemsCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold min-w-[18px] h-[18px] px-1">
                    {pendingActionItemsCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attention">
              <div className="space-y-3" ref={interventionRef}>
                <InterventionCardsRow {...interventionProps} variant="pill" />

                {/* Follow-Up Queue */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-semibold text-foreground whitespace-nowrap">Follow-Up Queue</h3>
                      {activeFilter && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5"
                          style={{
                            backgroundColor: `${({'never_logged_in':'#F59E0B','dead_on_arrival':'#EA580C','at_risk':'#DC2626','missed_onboarding':'#7C3AED'} as Record<string,string>)[activeFilter] ?? '#888'}26`,
                            color: ({'never_logged_in':'#F59E0B','dead_on_arrival':'#EA580C','at_risk':'#DC2626','missed_onboarding':'#7C3AED'} as Record<string,string>)[activeFilter] ?? '#888',
                          }}
                        >
                          Showing: {activeFilter.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                          <button onClick={() => setActiveFilter(null)} className="ml-0.5 hover:opacity-70 cursor-pointer">✕</button>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="font-bold text-emerald-600">{filteredContactedCount} contacted</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="flex items-center gap-1">
                        <span className="font-bold text-amber-600">{pendingStudentCount} pending</span>
                        {pendingStudentCount > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        )}
                      </span>
                    </div>
                  </div>
                  <FollowUpQueue
                    students={queueStudents}
                    outreachStatuses={outreachMap}
                    onStatusChange={handleStatusChange}
                    activeFilter={activeFilter}
                    onClearFilter={() => setActiveFilter(null)}
                    hideHeader
                    readOnly={isReadOnly}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insights">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <OutreachEffectivenessCard contactedCount={filteredContactedCount} reEngagedFromOutreach={reEngagedFromOutreachCount} />
                <WeeklyActivityCard wau={metrics.wau} />
                <CourseBottleneckCard stuckStudents={0} onClick={() => setOpenDetail('course_bottleneck')} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div className="bg-card rounded-lg border shadow-sm p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground font-medium">Avg Response Time</p>
                    <p className="text-xl font-bold text-foreground">
                      {insightMetrics?.hasOutreachData ? `${insightMetrics.avgResponseTimeHours}h` : '—'}
                    </p>
                    <p className="text-[9px] text-muted-foreground">Time to first outreach</p>
                  </div>
                </div>
                <div className="bg-card rounded-lg border shadow-sm p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <Layers className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground font-medium">Progress Distribution</p>
                      <p className="text-[9px] text-muted-foreground">Student progression spread</p>
                    </div>
                  </div>
                  {(() => {
                    const bracketDefs = [
                      { label: '0%', color: 'bg-slate-400', min: 0, max: 1 },
                      { label: '1-24%', color: 'bg-red-500', min: 1, max: 25 },
                      { label: '25-49%', color: 'bg-amber-500', min: 25, max: 50 },
                      { label: '50-74%', color: 'bg-blue-500', min: 50, max: 75 },
                      { label: '75-99%', color: 'bg-violet-500', min: 75, max: 100 },
                      { label: '100%', color: 'bg-emerald-500', min: 100, max: 101 },
                    ];
                    const counts = bracketDefs.map(b =>
                      students.filter((s: any) => {
                        const p = s.progressPercentage || 0;
                        return b.label === '100%' ? p >= 100 : b.label === '0%' ? p === 0 : p >= b.min && p < b.max;
                      }).length
                    );
                    const total = Math.max(students.length, 1);
                    return (
                      <>
                        <div className="flex h-3 w-full overflow-hidden rounded-full bg-secondary/30">
                          {bracketDefs.map((b, i) => counts[i] > 0 ? (
                            <div key={i} className={`${b.color} transition-all`} style={{ width: `${(counts[i] / total) * 100}%` }} />
                          ) : null)}
                        </div>
                        <div className="grid grid-cols-3 gap-x-3 gap-y-1">
                          {bracketDefs.map((b, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[10px]">
                              <div className={`h-2 w-2 rounded-full ${b.color} shrink-0`} />
                              <span className="text-muted-foreground">{b.label}:</span>
                              <span className="font-semibold text-foreground">{counts[i]}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="bg-card rounded-lg border shadow-sm p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground font-medium">Quiz Pass Rate</p>
                    <p className="text-xl font-bold text-foreground">
                      {insightMetrics?.hasQuizData ? `${insightMetrics.quizPassRate}%` : '—'}
                    </p>
                    <p className="text-[9px] text-muted-foreground">Overall pass ratio</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="wins">
              <TrackingRow
                reEngagedCount={metrics.reEngagedCount}
                offboardedCount={metrics.offboardedCount}
                onReEngagementClick={() => setOpenDetail('re_engagement')}
                onOffboardingClick={() => setOpenDetail('offboarding')}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div className="bg-card rounded-lg border shadow-sm p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Trophy className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground font-medium">Milestone Celebrations</p>
                    <p className="text-xl font-bold text-foreground">
                      {insightMetrics?.milestonesThisWeek ?? 0}
                    </p>
                    <p className="text-[9px] text-muted-foreground">Milestones completed this week</p>
                  </div>
                </div>
                <div className="bg-card rounded-lg border shadow-sm p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Flame className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground font-medium">Streak Champions</p>
                    <p className="text-xl font-bold text-foreground">
                      {insightMetrics?.streakChampions ?? 0}
                    </p>
                    <p className="text-[9px] text-muted-foreground">Students with 7+ day streaks</p>
                  </div>
                </div>
                <div className="bg-card rounded-lg border shadow-sm p-4 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Star className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground font-medium">Recently Graduated</p>
                    <p className="text-xl font-bold text-foreground">
                      {students.filter((s: any) => s.progressPercentage >= 100).length}
                    </p>
                    <p className="text-[9px] text-muted-foreground">Completed all phases</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="todo">
              <CSMToDoTab />
            </TabsContent>
          </Tabs>

          <CSMDetailDialog openDetail={openDetail} onClose={() => setOpenDetail(null)} readOnly={isReadOnly} metrics={metrics} />
        </>
      )}
    </div>
  );
}
