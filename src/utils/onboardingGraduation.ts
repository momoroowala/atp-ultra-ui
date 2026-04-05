import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from "@tanstack/react-query";

/**
 * Attempts to graduate the user from onboarding after completing a task.
 * Checks if the completed task is the first task of the first accessible course,
 * and if so, sets onboarding_completed = true immediately.
 */
export async function tryGraduateOnboarding(
  userId: string,
  completedTaskId: string,
  queryClient: QueryClient
) {
  try {
    // 1. Check if already graduated
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("onboarding_completed")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.onboarding_completed) return;

    // 2. Find the first task of the first phase of the first accessible course
    // Get user's tier to find accessible courses
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("tier_id")
      .eq("id", userId)
      .maybeSingle();

    // Get courses ordered by course_order
    const { data: courses } = await supabase
      .from("courses")
      .select("id")
      .eq("is_active", true)
      .order("course_order", { ascending: true });

    if (!courses?.length) return;

    // Find first course user has access to
    let firstCourseId: string | null = null;
    for (const course of courses) {
      // Check access via user_course_access table or visible_tier_ids
      const { data: access } = await supabase
        .from("user_course_access")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", course.id)
        .maybeSingle();

      if (access) {
        firstCourseId = course.id;
        break;
      }
    }

    if (!firstCourseId) return;

    // 3. Get first phase's first task
    const { data: phases } = await supabase
      .from("phases")
      .select("id")
      .eq("course_id", firstCourseId)
      .eq("is_active", true)
      .order("phase_order", { ascending: true });

    if (!phases?.length) return;

    for (const phase of phases) {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("id")
        .eq("phase_id", phase.id)
        .eq("is_active", true)
        .order("task_order", { ascending: true })
        .limit(1);

      if (tasks?.length) {
        const firstTaskId = tasks[0].id;

        // 4. Check if the completed task matches the first onboarding task
        if (completedTaskId === firstTaskId) {
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
            .eq("id", userId);

          queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
        }
        return;
      }
    }
  } catch (err) {
    console.error("Onboarding graduation check failed:", err);
  }
}
