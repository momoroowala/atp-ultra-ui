import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCourses } from "./useCourses";
import { useCurrentUserProfile } from "./useCurrentUserProfile";
import { useEffect } from "react";

interface OnboardingStatus {
  isOnboarding: boolean;
  isLoading: boolean;
  firstCourse: { id: string; title: string } | null;
  firstPhase: { id: string; title: string } | null;
  firstTaskId: string | null;
  completedTasks: number;
  totalTasks: number;
  progressPercent: number;
}

export const useOnboardingStatus = (): OnboardingStatus => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { profile: currentProfile, isLoading: profileLoading } = useCurrentUserProfile();

  const firstAccessibleCourse = courses?.find((c) => c.hasAccess) || null;

  const { data, isLoading: statusLoading } = useQuery({
    queryKey: ["onboarding-status", user?.id, firstAccessibleCourse?.id, currentProfile?.onboarding_completed],
    queryFn: async () => {
      if (!user) throw new Error("No user");

      // 1. Check the permanent flag from shared profile (no extra query)
      if (currentProfile?.onboarding_completed) {
        return { graduated: true } as const;
      }

      // 2. No accessible course → can't onboard, show normal dashboard
      if (!firstAccessibleCourse) {
        return { graduated: true } as const;
      }

      // 3. Get all active phases of first course, ordered
      const { data: phases } = await supabase
        .from("phases")
        .select("id, title")
        .eq("course_id", firstAccessibleCourse.id)
        .eq("is_active", true)
        .order("phase_order", { ascending: true });

      if (!phases || phases.length === 0) {
        return { graduated: true } as const;
      }

      // 4. Find the first phase that has active tasks
      let firstPhase: { id: string; title: string } | null = null;
      let taskIds: string[] = [];
      let firstTaskId: string | null = null;

      for (const phase of phases) {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("id")
          .eq("phase_id", phase.id)
          .eq("is_active", true)
          .order("task_order", { ascending: true });

        if (tasks && tasks.length > 0) {
          firstPhase = phase;
          taskIds = tasks.map((t) => t.id);
          firstTaskId = taskIds[0];
          break;
        }
      }

      if (!firstPhase || taskIds.length === 0) {
        return { graduated: true } as const;
      }

      // 5. Check if first task is completed
      const { data: firstTaskResponse } = await supabase
        .from("task_responses")
        .select("task_id")
        .eq("task_id", firstTaskId)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .maybeSingle();

      const firstTaskDone = !!firstTaskResponse;

      // Also get overall counts for progress display
      const { data: responses } = await supabase
        .from("task_responses")
        .select("task_id")
        .in("task_id", taskIds)
        .eq("user_id", user.id)
        .eq("status", "completed");

      const completedTasks = responses?.length || 0;
      const totalTasks = taskIds.length;

      return {
        graduated: false,
        firstTaskDone,
        firstPhase,
        firstTaskId,
        completedTasks,
        totalTasks,
      } as const;
    },
    enabled: !!user && !coursesLoading && !profileLoading,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Auto-graduate when Phase 1 is fully completed
  useEffect(() => {
    if (!data || data.graduated || !("firstTaskDone" in data) || !data.firstTaskDone || !user) return;

    const graduate = async () => {
      const now = new Date();
      const offboarding = new Date(now);
      offboarding.setMonth(offboarding.getMonth() + 6);

      await supabase
        .from("user_profiles")
        .update({
          onboarding_completed: true,
          onboarding_date: now.toISOString(),
          offboarding_date: offboarding.toISOString().slice(0, 10),
        } as any)
        .eq("id", user.id);

      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
    };
    graduate();
  }, [data, user, queryClient]);

  const isLoading = coursesLoading || profileLoading || statusLoading;

  if (isLoading || !data) {
    return {
      isOnboarding: false,
      isLoading: true,
      firstCourse: null,
      firstPhase: null,
      firstTaskId: null,
      completedTasks: 0,
      totalTasks: 0,
      progressPercent: 0,
    };
  }

  if (data.graduated) {
    return {
      isOnboarding: false,
      isLoading: false,
      firstCourse: firstAccessibleCourse ? { id: firstAccessibleCourse.id, title: firstAccessibleCourse.title } : null,
      firstPhase: null,
      firstTaskId: null,
      completedTasks: 0,
      totalTasks: 0,
      progressPercent: 0,
    };
  }

  const progressPercent = data.totalTasks > 0 ? Math.round((data.completedTasks / data.totalTasks) * 100) : 0;

  return {
    isOnboarding: !data.firstTaskDone,
    isLoading: false,
    firstCourse: firstAccessibleCourse ? { id: firstAccessibleCourse.id, title: firstAccessibleCourse.title } : null,
    firstPhase: data.firstPhase,
    firstTaskId: data.firstTaskId,
    completedTasks: data.completedTasks,
    totalTasks: data.totalTasks,
    progressPercent,
  };
};
