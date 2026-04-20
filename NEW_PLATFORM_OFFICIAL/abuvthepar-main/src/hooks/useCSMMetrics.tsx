import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays, subDays } from 'date-fns';

export interface CSMMetrics {
  totalUsers: number;
  wau: number;
  mau: number;
  courseCompletionPercent: number;
  avgProgress: number;
  neverLoggedIn: Array<{ id: string; firstName: string; lastName: string; email: string; joinedDate: string }>;
  deadOnArrival: Array<{ id: string; firstName: string; lastName: string; email: string; lastSignInAt: string }>;
  atRisk: Array<{ id: string; firstName: string; lastName: string; email: string; lastSignInAt: string; daysInactive: number; progress: number }>;
  reEngaged: Array<{ id: string; firstName: string; lastName: string; email: string; lastSignInAt: string; progress: number }>;
  reEngagedCount: number;
  offboarded: Array<{ id: string; firstName: string; lastName: string; email: string; lastSignInAt: string }>;
  offboardedCount: number;
}

export function useCSMMetrics(usersData: any) {
  const students = usersData?.users || [];

  return {
    totalUsers: students.length,
    wau: students.filter((s: any) => {
      if (!s.lastSignInAt) return false;
      return differenceInDays(new Date(), new Date(s.lastSignInAt)) <= 7;
    }).length,
    mau: students.filter((s: any) => {
      if (!s.lastSignInAt) return false;
      return differenceInDays(new Date(), new Date(s.lastSignInAt)) <= 30;
    }).length,
    courseCompletionPercent: students.length > 0
      ? Math.round((students.filter((s: any) => s.progressPercentage >= 100).length / students.length) * 100)
      : 0,
    avgProgress: students.length > 0
      ? Math.round(students.reduce((sum: number, s: any) => sum + (s.progressPercentage || 0), 0) / students.length)
      : 0,
    neverLoggedIn: students
      .filter((s: any) => s.isActive && !s.lastSignInAt)
      .map((s: any) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        joinedDate: s.joinedDate,
      })),
    deadOnArrival: students
      .filter((s: any) => s.isActive && s.lastSignInAt && s.completedTasks === 0 && s.progressPercentage === 0)
      .map((s: any) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        lastSignInAt: s.lastSignInAt,
      })),
    atRisk: students
      .filter((s: any) => {
        if (!s.isActive || !s.lastSignInAt) return false;
        const daysInactive = differenceInDays(new Date(), new Date(s.lastSignInAt));
        return daysInactive >= 7 && s.completedTasks > 0;
      })
      .map((s: any) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        lastSignInAt: s.lastSignInAt,
        daysInactive: differenceInDays(new Date(), new Date(s.lastSignInAt)),
        progress: s.progressPercentage,
      }))
      .sort((a: any, b: any) => b.daysInactive - a.daysInactive),
    reEngaged: students
      .filter((s: any) => {
        if (!s.isActive || !s.lastSignInAt) return false;
        const daysSince = differenceInDays(new Date(), new Date(s.lastSignInAt));
        return daysSince <= 7 && s.progressPercentage > 0 && s.progressPercentage < 30;
      })
      .map((s: any) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        lastSignInAt: s.lastSignInAt,
        progress: s.progressPercentage,
      })),
    get reEngagedCount() { return this.reEngaged.length; },
    offboarded: students
      .filter((s: any) => !s.isActive)
      .map((s: any) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        lastSignInAt: s.lastSignInAt,
      })),
    get offboardedCount() { return this.offboarded.length; },
  } as CSMMetrics;
}

export function useCSMOutreachStatus() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['csm-outreach-status'],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('csm_outreach_status' as any)
        .select('*') as any);
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
      const [eventsRes, profilesRes] = await Promise.all([
        supabase
          .from('missed_onboarding_events' as any)
          .select('*')
          .eq('attendance_status', 'missed')
          .eq('rescheduled', false),
        supabase
          .from('user_profiles')
          .select('id, onboarding_booking_status')
      ]);
      if (eventsRes.error) throw eventsRes.error;
      const completedIds = new Set(
        (profilesRes.data || [])
          .filter((p: any) => p.onboarding_booking_status === 'completed')
          .map((p: any) => p.id)
      );
      return ((eventsRes.data || []) as any[]).filter((e: any) => !completedIds.has(e.user_id));
    },
    enabled: !!user,
  });
}

export function useCSMInsightMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['csm-insight-metrics'],
    queryFn: async () => {
      // Run all queries in parallel
      const [quizRes, streakRes, outreachRes, milestonesRes] = await Promise.all([
        // Quiz pass rate
        supabase.from('quiz_submissions').select('passed'),
        // Streak champions (7+ day streaks)
        supabase.from('user_login_streaks').select('user_id').gte('current_streak', 7),
        // Avg response time from outreach statuses
        supabase.from('csm_outreach_status' as any).select('created_at,updated_at,status').eq('status', 'contacted'),
        // Milestones completed this week
        supabase.from('csm_milestone_completions').select('id').gte('completed_at', subDays(new Date(), 7).toISOString()),
      ]);

      // Quiz pass rate
      const quizData = quizRes.data || [];
      const totalQuizzes = quizData.length;
      const passedQuizzes = quizData.filter((q: any) => q.passed).length;
      const quizPassRate = totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0;

      // Streak champions count
      const streakChampions = (streakRes.data || []).length;

      // Avg response time in hours
      const outreachRows = (outreachRes.data || []) as any[];
      let avgResponseTimeHours = 0;
      if (outreachRows.length > 0) {
        const totalHours = outreachRows.reduce((sum: number, row: any) => {
          const created = new Date(row.created_at).getTime();
          const updated = new Date(row.updated_at).getTime();
          return sum + Math.max(0, (updated - created) / (1000 * 60 * 60));
        }, 0);
        avgResponseTimeHours = Math.round(totalHours / outreachRows.length);
      }

      // Milestones this week
      const milestonesThisWeek = (milestonesRes.data || []).length;

      return {
        quizPassRate,
        streakChampions,
        avgResponseTimeHours,
        milestonesThisWeek,
        hasOutreachData: outreachRows.length > 0,
        hasQuizData: totalQuizzes > 0,
      };
    },
    enabled: !!user,
  });
}
