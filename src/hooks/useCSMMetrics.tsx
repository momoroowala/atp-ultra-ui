import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays } from 'date-fns';

export interface PhaseDropOff {
  phase: string;
  count: number;
  pct: number;
}

export interface CohortMetric {
  week: number;
  avgProgress: number;
  activeRate: number;
  count: number;
}

export interface CSMMetrics {
  totalUsers: number;
  wau: number;
  mau: number;
  courseCompletionPercent: number;
  avgProgress: number;
  neverLoggedIn: Array<{ id: string; firstName: string; lastName: string; email: string; joinedDate: string }>;
  deadOnArrival: Array<{ id: string; firstName: string; lastName: string; email: string; lastSignInAt: string }>;
  atRisk: Array<{ id: string; firstName: string; lastName: string; email: string; lastSignInAt: string; daysInactive: number; progress: number; revenue?: number; tier?: string }>;
  reEngaged: Array<{ id: string; firstName: string; lastName: string; email: string; lastSignInAt: string; progress: number }>;
  reEngagedCount: number;
  offboarded: Array<{ id: string; firstName: string; lastName: string; email: string; lastSignInAt: string }>;
  offboardedCount: number;
  // Financial
  revenueAtRisk: number;
  totalPortfolioValue: number;
  avgStudentRevenue: number;
  firstSaleConversionRate: number;
  firstSaleCount: number;
  // Curriculum
  phaseDropOff: PhaseDropOff[];
  bottleneckPhase: { name: string; stuckCount: number } | null;
  stuckStudents: number;
  avgCompletionVelocityDays: number;
  // Business / Engagement
  npsScore: number;
  npsBreakdown: { promoters: number; passives: number; detractors: number };
  communityEngagementRate: number;
  avgCalendarAttendance: number;
  dailyActiveUsers: number[];
  cohortMetrics: CohortMetric[];
}

export function useCSMMetrics(usersData: any) {
  const students = usersData?.users || [];
  const now = new Date();
  const phaseNames = ['Product Research', 'Sourcing', 'Listing & Launch', 'Scale & Optimize'];

  // ── Base metrics ──
  const wau = students.filter((s: any) => {
    if (!s.lastSignInAt) return false;
    return differenceInDays(now, new Date(s.lastSignInAt)) <= 7;
  }).length;

  const mau = students.filter((s: any) => {
    if (!s.lastSignInAt) return false;
    return differenceInDays(now, new Date(s.lastSignInAt)) <= 30;
  }).length;

  const avgProgress = students.length > 0
    ? Math.round(students.reduce((sum: number, s: any) => sum + (s.progressPercentage || 0), 0) / students.length)
    : 0;

  const neverLoggedIn = students
    .filter((s: any) => s.isActive && !s.lastSignInAt)
    .map((s: any) => ({
      id: s.id, firstName: s.firstName, lastName: s.lastName, email: s.email, joinedDate: s.joinedDate,
    }));

  const deadOnArrival = students
    .filter((s: any) => s.isActive && s.lastSignInAt && (s.completedTasks || 0) === 0 && (s.progressPercentage || 0) === 0)
    .map((s: any) => ({
      id: s.id, firstName: s.firstName, lastName: s.lastName, email: s.email, lastSignInAt: s.lastSignInAt,
    }));

  const atRisk = students
    .filter((s: any) => {
      if (!s.isActive || !s.lastSignInAt) return false;
      const daysInactive = differenceInDays(now, new Date(s.lastSignInAt));
      return daysInactive >= 7 && (s.completedTasks || 0) > 0;
    })
    .map((s: any) => ({
      id: s.id, firstName: s.firstName, lastName: s.lastName, email: s.email,
      lastSignInAt: s.lastSignInAt,
      daysInactive: differenceInDays(now, new Date(s.lastSignInAt)),
      progress: s.progressPercentage,
      revenue: s.revenue || 0,
      tier: s.tier || 'STB',
    }))
    .sort((a: any, b: any) => b.daysInactive - a.daysInactive);

  const reEngaged = students
    .filter((s: any) => {
      if (!s.isActive || !s.lastSignInAt) return false;
      const daysSince = differenceInDays(now, new Date(s.lastSignInAt));
      return daysSince <= 7 && s.progressPercentage > 0 && s.progressPercentage < 30;
    })
    .map((s: any) => ({
      id: s.id, firstName: s.firstName, lastName: s.lastName, email: s.email,
      lastSignInAt: s.lastSignInAt, progress: s.progressPercentage,
    }));

  const offboarded = students
    .filter((s: any) => !s.isActive)
    .map((s: any) => ({
      id: s.id, firstName: s.firstName, lastName: s.lastName, email: s.email, lastSignInAt: s.lastSignInAt,
    }));

  // ── Financial metrics ──
  const activeStudents = students.filter((s: any) => s.isActive);
  const revenueAtRisk = [...atRisk, ...deadOnArrival].reduce((sum, s: any) => {
    const match = students.find((st: any) => st.id === s.id);
    return sum + (match?.revenue || 0);
  }, 0);
  const totalPortfolioValue = activeStudents.reduce((sum: number, s: any) => sum + (s.revenue || 0), 0);
  const avgStudentRevenue = activeStudents.length > 0
    ? Math.round(totalPortfolioValue / activeStudents.length)
    : 0;
  const studentsWithSale = students.filter((s: any) => s.firstSaleDate);
  const firstSaleCount = studentsWithSale.length;
  const firstSaleConversionRate = students.length > 0
    ? Math.round((firstSaleCount / students.length) * 100)
    : 0;

  // ── Curriculum metrics ──
  const stuckList = students.filter((s: any) => {
    if (!s.isActive || !s.lastSignInAt) return false;
    const daysInactive = differenceInDays(now, new Date(s.lastSignInAt));
    return daysInactive >= 7 && (s.progressPercentage || 0) < 50 && (s.progressPercentage || 0) > 0;
  });
  const stuckStudents = stuckList.length;

  // Phase drop-off: count students stuck at each phase
  const phaseCountMap: Record<string, number> = {};
  stuckList.forEach((s: any) => {
    const phaseName = s.currentPhaseName || phaseNames[Math.min(Math.floor((s.progressPercentage || 0) / 25), 3)];
    phaseCountMap[phaseName] = (phaseCountMap[phaseName] || 0) + 1;
  });
  const phaseDropOff: PhaseDropOff[] = phaseNames.map(name => ({
    phase: name,
    count: phaseCountMap[name] || 0,
    pct: stuckStudents > 0 ? Math.round(((phaseCountMap[name] || 0) / stuckStudents) * 100) : 0,
  }));

  const maxPhase = phaseDropOff.reduce((best, p) => p.count > best.count ? p : best, { phase: '', count: 0, pct: 0 });
  const bottleneckPhase = maxPhase.count > 0 ? { name: maxPhase.phase, stuckCount: maxPhase.count } : null;

  // Avg completion velocity: days from joinedDate to reaching current phase
  const studentsWithProgress = students.filter((s: any) => s.joinedDate && (s.currentPhase || 0) > 1);
  const avgCompletionVelocityDays = studentsWithProgress.length > 0
    ? Math.round(
        studentsWithProgress.reduce((sum: number, s: any) => {
          const daysEnrolled = differenceInDays(now, new Date(s.joinedDate));
          const phasesCompleted = (s.currentPhase || 1) - 1;
          return sum + (phasesCompleted > 0 ? daysEnrolled / phasesCompleted : 0);
        }, 0) / studentsWithProgress.length
      )
    : 0;

  // ── Business / Engagement metrics ──
  const studentsWithNps = students.filter((s: any) => s.npsScore != null);
  let npsScore = 0;
  const npsBreakdown = { promoters: 0, passives: 0, detractors: 0 };
  if (studentsWithNps.length > 0) {
    studentsWithNps.forEach((s: any) => {
      if (s.npsScore >= 9) npsBreakdown.promoters++;
      else if (s.npsScore >= 7) npsBreakdown.passives++;
      else npsBreakdown.detractors++;
    });
    npsScore = Math.round(
      ((npsBreakdown.promoters - npsBreakdown.detractors) / studentsWithNps.length) * 100
    );
  }

  const communityActive = students.filter((s: any) => (s.communityPostCount || 0) > 0).length;
  const communityEngagementRate = students.length > 0
    ? Math.round((communityActive / students.length) * 100)
    : 0;

  const calStudents = students.filter((s: any) => s.calendarAttendance != null && s.isActive);
  const avgCalendarAttendance = calStudents.length > 0
    ? Math.round(calStudents.reduce((sum: number, s: any) => sum + (s.calendarAttendance || 0), 0) / calStudents.length)
    : 0;

  // Daily active users sparkline (last 7 days)
  const dailyActiveUsers: number[] = [];
  for (let d = 6; d >= 0; d--) {
    const count = students.filter((s: any) => {
      if (!s.lastSignInAt) return false;
      const diff = differenceInDays(now, new Date(s.lastSignInAt));
      return diff === d;
    }).length;
    dailyActiveUsers.push(count);
  }

  // Cohort metrics
  const cohortMap: Record<number, { progress: number[]; active: number; total: number }> = {};
  students.forEach((s: any) => {
    const week = s.cohortWeek || 1;
    if (!cohortMap[week]) cohortMap[week] = { progress: [], active: 0, total: 0 };
    cohortMap[week].progress.push(s.progressPercentage || 0);
    cohortMap[week].total++;
    if (s.isActive) cohortMap[week].active++;
  });
  const cohortMetrics: CohortMetric[] = Object.entries(cohortMap)
    .map(([week, data]) => ({
      week: Number(week),
      avgProgress: Math.round(data.progress.reduce((a, b) => a + b, 0) / data.progress.length),
      activeRate: Math.round((data.active / data.total) * 100),
      count: data.total,
    }))
    .sort((a, b) => a.week - b.week);

  return {
    totalUsers: students.length,
    wau,
    mau,
    courseCompletionPercent: students.length > 0
      ? Math.round((students.filter((s: any) => s.progressPercentage >= 100).length / students.length) * 100)
      : 0,
    avgProgress,
    neverLoggedIn,
    deadOnArrival,
    atRisk,
    reEngaged,
    reEngagedCount: reEngaged.length,
    offboarded,
    offboardedCount: offboarded.length,
    // Financial
    revenueAtRisk,
    totalPortfolioValue,
    avgStudentRevenue,
    firstSaleConversionRate,
    firstSaleCount,
    // Curriculum
    phaseDropOff,
    bottleneckPhase,
    stuckStudents,
    avgCompletionVelocityDays,
    // Business / Engagement
    npsScore,
    npsBreakdown,
    communityEngagementRate,
    avgCalendarAttendance,
    dailyActiveUsers,
    cohortMetrics,
  } as CSMMetrics;
}

export function useCSMOutreachStatus() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['csm-outreach-status', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('csm_outreach_status' as any)
        .select('*')
        .eq('updated_by', user!.id) as any);
      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        user_id: string;
        metric_type: string;
        status: string;
        updated_by: string;
        updated_at: string;
      }>;
    },
    enabled: !!user,
  });

  const upsertStatus = async (userId: string, metricType: string, status: string) => {
    const { error } = await supabase
      .from('csm_outreach_status' as any)
      .upsert(
        {
          user_id: userId,
          metric_type: metricType,
          status,
          updated_by: user?.id,
        },
        { onConflict: 'user_id,metric_type' }
      );
    if (error) throw error;
    query.refetch();
  };

  return {
    ...query,
    upsertStatus,
  };
}

export function useMissedOnboarding() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['missed-onboarding-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missed_onboarding_events' as any)
        .select('*')
        .eq('attendance_status', 'missed')
        .eq('rescheduled', false);
      if (error) throw error;

      // Filter to only those where scheduled_call_time was > 48h ago
      const now = new Date();
      return ((data || []) as any[]).filter((e: any) => {
        const scheduled = new Date(e.scheduled_call_time);
        const hoursSince = (now.getTime() - scheduled.getTime()) / (1000 * 60 * 60);
        return hoursSince >= 48;
      });
    },
    enabled: !!user,
  });
}
