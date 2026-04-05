import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SprintPhase } from './useSprintData';

interface TaskPayload {
  id?: string;
  phase_id: string;
  day_number: number;
  title: string;
  sort_order: number;
  is_checkpoint: boolean;
  is_final: boolean;
  success_metrics?: string | null;
  common_mistakes?: string | null;
  templates?: Array<{ label: string; url: string }> | null;
}

export const useSprintAdmin = () => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['sprint-phases'] });
    qc.invalidateQueries({ queryKey: ['sprint-tasks'] });
  };

  const createPhase = useMutation({
    mutationFn: async (p: Omit<SprintPhase, 'id'>) => {
      const { error } = await supabase.from('sprint_phases' as any).insert(p as any);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Phase created'); },
    onError: (e: any) => toast.error(e.message),
  });

  const updatePhase = useMutation({
    mutationFn: async ({ id, ...p }: SprintPhase) => {
      const { error } = await supabase.from('sprint_phases' as any).update(p as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Phase updated'); },
    onError: (e: any) => toast.error(e.message),
  });

  const deletePhase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sprint_phases' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Phase deleted'); },
    onError: (e: any) => toast.error(e.message),
  });

  const createTask = useMutation({
    mutationFn: async (t: Omit<TaskPayload, 'id'>) => {
      const { error } = await supabase.from('sprint_tasks' as any).insert(t as any);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Task created'); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...t }: TaskPayload & { id: string }) => {
      const { error } = await supabase.from('sprint_tasks' as any).update(t as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Task updated'); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sprint_tasks' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Task deleted'); },
    onError: (e: any) => toast.error(e.message),
  });

  const addModule = useMutation({
    mutationFn: async (m: { task_id: string; module_name: string; sort_order: number }) => {
      const { error } = await supabase.from('sprint_task_modules' as any).insert(m as any);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Module added'); },
    onError: (e: any) => toast.error(e.message),
  });

  const removeModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sprint_task_modules' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Module removed'); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleUserCompletion = useMutation({
    mutationFn: async ({ userId, taskId, taskDay, completed }: { userId: string; taskId: string; taskDay: number; completed: boolean }) => {
      const status = completed ? 'completed' : 'not_started';
      const { error } = await supabase
        .from('sprint_task_completions' as any)
        .upsert(
          { user_id: userId, task_id: taskId, task_day: taskDay, completed, completed_at: completed ? new Date().toISOString() : null, status } as any,
          { onConflict: 'user_id,task_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Completion updated'); },
    onError: (e: any) => toast.error(e.message),
  });

  return { createPhase, updatePhase, deletePhase, createTask, updateTask, deleteTask, addModule, removeModule, toggleUserCompletion };
};
