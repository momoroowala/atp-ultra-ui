import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays } from 'date-fns';

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
