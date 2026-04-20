/**
 * ADMIN-READY: All 30 Day Sprint content (phases, tasks, module links) is stored in:
 *
 * - sprint_phases — edit phase names, day ranges, goals, banners, order
 * - sprint_tasks — add/edit/delete/reorder tasks, set checkpoint and final flags
 * - sprint_task_modules — add/edit/delete module links per task
 *
 * A future admin UI will perform CRUD on these tables. Any change in the DB is
 * instantly reflected on the /my-plan page with no code changes needed.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type TaskStatus = 'pending' | 'completed';

export interface SprintPhase {
  id: string;
  title: string;
  day_start: number;
  day_end: number;
  goal_text: string | null;
  completion_banner_text: string | null;
  sort_order: number;
}

export interface SprintTaskModule {
  id: string;
  module_name: string;
  sort_order: number;
}

export interface SprintTask {
  id: string;
  phase_id: string;
  day_number: number;
  title: string;
  sort_order: number;
  is_checkpoint: boolean;
  is_final: boolean;
  modules: SprintTaskModule[];
  success_metrics: string | null;
  common_mistakes: string | null;
  templates: Array<{ label: string; url: string }> | null;
}

export const useSprintData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Fetch phases
  const { data: phases = [], isLoading: phasesLoading } = useQuery({
    queryKey: ['sprint-phases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sprint_phases' as any)
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as unknown as SprintPhase[];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch tasks with modules
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['sprint-tasks'],
    queryFn: async () => {
      const { data: tasksData, error: tasksError } = await supabase
        .from('sprint_tasks' as any)
        .select('*')
        .order('sort_order');
      if (tasksError) throw tasksError;

      const { data: modulesData, error: modulesError } = await supabase
        .from('sprint_task_modules' as any)
        .select('*')
        .order('sort_order');
      if (modulesError) throw modulesError;

      // Group modules by task_id
      const modulesByTask = new Map<string, SprintTaskModule[]>();
      (modulesData ?? []).forEach((m: any) => {
        const list = modulesByTask.get(m.task_id) ?? [];
        list.push({ id: m.id, module_name: m.module_name, sort_order: m.sort_order });
        modulesByTask.set(m.task_id, list);
      });

      return (tasksData ?? []).map((t: any) => ({
        id: t.id,
        phase_id: t.phase_id,
        day_number: t.day_number,
        title: t.title,
        sort_order: t.sort_order,
        is_checkpoint: t.is_checkpoint ?? false,
        is_final: t.is_final ?? false,
        modules: modulesByTask.get(t.id) ?? [],
        success_metrics: t.success_metrics ?? null,
        common_mistakes: t.common_mistakes ?? null,
        templates: t.templates ?? null,
      })) as SprintTask[];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch completions as Map<taskId, status>
  const { data: completions = new Map<string, TaskStatus>(), isLoading: completionsLoading } = useQuery({
    queryKey: ['sprint-completions-v2', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sprint_task_completions' as any)
        .select('task_id, completed, status')
        .eq('user_id', userId!)
        .not('task_id', 'is', null);
      if (error) throw error;
      const map = new Map<string, TaskStatus>();
      data?.forEach((row: any) => {
        if (row.task_id) {
          const status = row.status as string;
          if (status === 'pending' || status === 'completed') {
            map.set(row.task_id, status);
          }
        }
      });
      return map;
    },
    enabled: !!userId,
  });

  // Cycle status: not_started -> pending -> completed -> not_started
  const cycleStatusMutation = useMutation({
    mutationFn: async ({ taskId, nextStatus }: { taskId: string; nextStatus: TaskStatus | 'not_started' }) => {
      const { error } = await supabase
        .from('sprint_task_completions' as any)
        .upsert(
          {
            user_id: userId!,
            task_id: taskId,
            task_day: tasks.find(t => t.id === taskId)?.day_number ?? 0,
            completed: nextStatus === 'completed',
            completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
            status: nextStatus,
          },
          { onConflict: 'user_id,task_id' }
        );
      if (error) throw error;
      return { taskId, nextStatus };
    },
    onMutate: async ({ taskId, nextStatus }: { taskId: string; nextStatus: TaskStatus | 'not_started' }) => {
      await queryClient.cancelQueries({ queryKey: ['sprint-completions-v2', userId] });
      const previous = queryClient.getQueryData<Map<string, TaskStatus>>(['sprint-completions-v2', userId]);

      queryClient.setQueryData<Map<string, TaskStatus>>(['sprint-completions-v2', userId], (old) => {
        const next = new Map(old);
        if (nextStatus === 'not_started') {
          next.delete(taskId);
        } else {
          next.set(taskId, nextStatus);
        }
        return next;
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['sprint-completions-v2', userId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint-completions-v2', userId] });
    },
  });

  // Wrapper: compute nextStatus from current state BEFORE mutate runs
  const cycleStatus = (taskId: string) => {
    const current = completions.get(taskId);
    const nextStatus: TaskStatus | 'not_started' = !current ? 'pending' : current === 'pending' ? 'completed' : 'not_started';
    cycleStatusMutation.mutate({ taskId, nextStatus });
  };

  // Direct status setter for drag-and-drop
  const setTaskStatus = (taskId: string, status: TaskStatus | 'not_started') => {
    cycleStatusMutation.mutate({ taskId, nextStatus: status });
  };

  // Derived helpers — only 'completed' counts toward progress
  const getPhaseTaskCount = (phaseId: string) =>
    tasks.filter(t => t.phase_id === phaseId).length;

  const getPhaseCompletedCount = (phaseId: string) =>
    tasks.filter(t => t.phase_id === phaseId && completions.get(t.id) === 'completed').length;

  const totalCompleted = tasks.filter(t => completions.get(t.id) === 'completed').length;
  const totalTasks = tasks.length;

  const getTasksForPhase = (phaseId: string) =>
    tasks.filter(t => t.phase_id === phaseId);

  return {
    phases,
    tasks,
    completions,
    isLoading: phasesLoading || tasksLoading || completionsLoading,
    cycleStatus,
    toggleCompletion: cycleStatus,
    setTaskStatus,
    getPhaseTaskCount,
    getPhaseCompletedCount,
    getTasksForPhase,
    totalCompleted,
    totalTasks,
  };
};
