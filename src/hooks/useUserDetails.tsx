import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useUserDetails = (userId: string) => {
  return useQuery({
    queryKey: ['user-details', userId],
    queryFn: async () => {
      // DEV MODE: Direct query instead of get-user-detail edge function (not deployed)
      const [profileResult, responsesResult, phasesResult, quizResult, coursesResult, loginStreakResult, ticketsResult] = await Promise.all([
        supabase.from('user_profiles').select('*, tiers(tier_key, display_name), roles(role_key, display_name)').eq('id', userId).single(),
        supabase.from('task_responses').select('*').eq('user_id', userId),
        supabase.from('phases').select('id, title, description, phase_order, course_id, is_active').eq('is_active', true).order('phase_order', { ascending: true }),
        supabase.from('quiz_submissions').select('*, quizzes(id, title, passing_grade)').eq('user_id', userId).order('submitted_at', { ascending: false }),
        supabase.from('courses').select('id, title, description, course_order, is_active').eq('is_active', true).order('course_order', { ascending: true }),
        supabase.from('user_login_streaks').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('support_tickets').select('id, ticket_number, subject, description, status, topic, priority, created_at, ticket_type').eq('submitter_user_id', userId).order('created_at', { ascending: false }),
      ]);

      const profile = profileResult.data;
      if (!profile) throw new Error('User not found');

      const responses = responsesResult.data || [];
      const phases = phasesResult.data || [];
      const quizSubmissions = quizResult.data || [];
      const loginStreak = loginStreakResult.data || null;
      const tickets = ticketsResult.data || [];

      const phaseIds = phases.map((p: any) => p.id);
      const { data: tasks } = await supabase.from('tasks').select('id, phase_id, title, description, task_order, points, is_active').in('phase_id', phaseIds.length > 0 ? phaseIds : ['none']).eq('is_active', true).order('task_order', { ascending: true });
      const allTasks = tasks || [];

      const completedResponses = responses.filter((r: any) => r.status === 'completed');
      const completedTaskIds = new Set(completedResponses.map((r: any) => r.task_id));
      const points = completedResponses.reduce((sum: number, r: any) => {
        const task = allTasks.find((t: any) => t.id === r.task_id);
        return sum + (task?.points || 0);
      }, 0);

      const tasksByPhase: Record<string, any[]> = {};
      for (const t of allTasks) { if (!tasksByPhase[t.phase_id]) tasksByPhase[t.phase_id] = []; tasksByPhase[t.phase_id].push(t); }

      const phasesWithTasks = phases.map((phase: any) => {
        const phaseTasks = tasksByPhase[phase.id] || [];
        return {
          ...phase,
          tasks: phaseTasks.map((t: any) => ({
            ...t,
            status: completedTaskIds.has(t.id) ? 'completed' : 'not_started',
            completed_at: completedResponses.find((r: any) => r.task_id === t.id)?.completed_at || null,
          })),
          completedCount: phaseTasks.filter((t: any) => completedTaskIds.has(t.id)).length,
          totalCount: phaseTasks.length,
        };
      });

      let csmName: string | null = null;
      if (profile.assigned_csm_id) {
        const { data: csmProfile } = await supabase.from('user_profiles').select('first_name, last_name').eq('id', profile.assigned_csm_id).single();
        if (csmProfile) csmName = `${csmProfile.first_name || ''} ${csmProfile.last_name || ''}`.trim() || null;
      }

      const tierData = Array.isArray(profile.tiers) ? profile.tiers[0] : profile.tiers;
      const roleData = Array.isArray(profile.roles) ? profile.roles[0] : profile.roles;

      return {
        profile: {
          ...profile,
          tier: tierData?.display_name || tierData?.tier_key || null,
          role: roleData?.display_name || roleData?.role_key || null,
          level: 1,
          points,
        },
        summary: {
          totalTasks: allTasks.length,
          completedTasks: completedResponses.length,
          notStartedTasks: allTasks.length - completedResponses.length,
          overdueTasks: 0,
          dueSoonTasks: 0,
          progressPercentage: allTasks.length > 0 ? Math.round((completedResponses.length / allTasks.length) * 100) : 0,
        },
        phases: phasesWithTasks,
        quizzes: quizSubmissions,
        loginStreak,
        tickets,
        csmName,
      };
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useSaveAdminNotes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, notes }: { userId: string; notes: string }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update({ admin_notes: notes } as any)
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-details', userId] });
    },
  });
};

export const useSaveOnboardingDetails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, details }: { userId: string; details: Record<string, any> }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update(details as any)
        .eq('id', userId);
      if (error) throw error;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-details', userId] });
    },
  });
};
