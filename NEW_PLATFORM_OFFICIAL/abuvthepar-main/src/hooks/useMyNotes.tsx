import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface NoteWithTask {
  id: string;
  content: string;
  updated_at: string;
  sprint_task_id: string;
  task_title: string;
  day_number: number;
  phase_id: string;
  phase_title: string;
  phase_sort_order: number;
}

export interface PhaseGroup {
  phase_id: string;
  phase_title: string;
  phase_sort_order: number;
  notes: NoteWithTask[];
}

export const useMyNotes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-notes', user?.id],
    enabled: !!user?.id,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // Fetch all notes for the user
      const { data: notes, error: notesError } = await supabase
        .from('sprint_task_notes')
        .select('id, content, updated_at, sprint_task_id')
        .eq('user_id', user!.id)
        .neq('content', '');

      if (notesError) throw notesError;
      if (!notes || notes.length === 0) return [] as PhaseGroup[];

      // Get unique task IDs
      const taskIds = [...new Set(notes.map(n => n.sprint_task_id))];

      // Fetch tasks
      const { data: tasks } = await supabase
        .from('sprint_tasks')
        .select('id, title, day_number, phase_id, sort_order')
        .in('id', taskIds);

      if (!tasks) return [] as PhaseGroup[];

      // Get unique phase IDs
      const phaseIds = [...new Set(tasks.map(t => t.phase_id))];

      // Fetch phases
      const { data: phases } = await supabase
        .from('sprint_phases')
        .select('id, title, sort_order')
        .in('id', phaseIds)
        .order('sort_order', { ascending: true });

      if (!phases) return [] as PhaseGroup[];

      // Build lookup maps
      const taskMap = new Map(tasks.map(t => [t.id, t]));
      const phaseMap = new Map(phases.map(p => [p.id, p]));

      // Build enriched notes
      const enrichedNotes: NoteWithTask[] = notes
        .map(note => {
          const task = taskMap.get(note.sprint_task_id);
          if (!task) return null;
          const phase = phaseMap.get(task.phase_id);
          if (!phase) return null;
          return {
            id: note.id,
            content: note.content,
            updated_at: note.updated_at,
            sprint_task_id: note.sprint_task_id,
            task_title: task.title,
            day_number: task.day_number,
            phase_id: task.phase_id,
            phase_title: phase.title,
            phase_sort_order: phase.sort_order,
          };
        })
        .filter(Boolean) as NoteWithTask[];

      // Group by phase
      const groupMap = new Map<string, PhaseGroup>();
      for (const note of enrichedNotes) {
        if (!groupMap.has(note.phase_id)) {
          groupMap.set(note.phase_id, {
            phase_id: note.phase_id,
            phase_title: note.phase_title,
            phase_sort_order: note.phase_sort_order,
            notes: [],
          });
        }
        groupMap.get(note.phase_id)!.notes.push(note);
      }

      // Sort phases by sort_order, notes by day_number within each phase
      const groups = Array.from(groupMap.values())
        .sort((a, b) => a.phase_sort_order - b.phase_sort_order);
      
      for (const group of groups) {
        group.notes.sort((a, b) => a.day_number - b.day_number);
      }

      return groups;
    },
  });
};
