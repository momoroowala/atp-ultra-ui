import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const NOTES_STORAGE_KEY = 'sprint_task_notes_local';

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

function getLocalNotes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export const useMyNotes = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-notes', user?.id],
    enabled: !!user?.id,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // First try Supabase
      let supabaseNotes: any[] | null = null;
      try {
        const { data: notes, error } = await supabase
          .from('sprint_task_notes' as any)
          .select('id, content, updated_at, sprint_task_id')
          .eq('user_id', user!.id)
          .neq('content', '');

        if (!error && notes && notes.length > 0) {
          supabaseNotes = notes;
        }
      } catch {
        // Supabase table may not exist on dev
      }

      // Get local notes as a supplement/fallback
      const localNotes = getLocalNotes();
      const localEntries = Object.entries(localNotes).filter(([, v]) => v && v.trim());

      // If we have neither, return empty
      if ((!supabaseNotes || supabaseNotes.length === 0) && localEntries.length === 0) {
        return [] as PhaseGroup[];
      }

      // Fetch sprint tasks and phases to enrich notes
      let tasks: any[] = [];
      let phases: any[] = [];
      try {
        const { data: t } = await supabase
          .from('sprint_tasks' as any)
          .select('id, title, day_number, phase_id, sort_order');
        tasks = t || [];

        if (tasks.length > 0) {
          const phaseIds = [...new Set(tasks.map((t: any) => t.phase_id))];
          const { data: p } = await supabase
            .from('sprint_phases' as any)
            .select('id, title, sort_order')
            .in('id', phaseIds)
            .order('sort_order', { ascending: true });
          phases = p || [];
        }
      } catch {
        // Tables may not exist
      }

      const taskMap = new Map(tasks.map((t: any) => [t.id, t]));
      const phaseMap = new Map(phases.map((p: any) => [p.id, p]));

      // Build a merged map of taskId -> {content, updated_at}
      // Supabase notes take priority, local notes fill gaps
      const mergedNotes = new Map<string, { id: string; content: string; updated_at: string; sprint_task_id: string }>();

      // Add Supabase notes first
      if (supabaseNotes) {
        for (const note of supabaseNotes) {
          mergedNotes.set(note.sprint_task_id, note);
        }
      }

      // Add local notes for tasks not already covered by Supabase
      for (const [taskId, content] of localEntries) {
        if (!mergedNotes.has(taskId)) {
          mergedNotes.set(taskId, {
            id: `local-${taskId}`,
            content,
            updated_at: new Date().toISOString(),
            sprint_task_id: taskId,
          });
        }
      }

      // Enrich with task/phase info
      const enrichedNotes: NoteWithTask[] = [];
      for (const note of mergedNotes.values()) {
        const task = taskMap.get(note.sprint_task_id);
        if (!task) {
          // Task not in DB -- still show the note with generic info
          enrichedNotes.push({
            id: note.id,
            content: note.content,
            updated_at: note.updated_at,
            sprint_task_id: note.sprint_task_id,
            task_title: 'Task',
            day_number: 0,
            phase_id: 'unknown',
            phase_title: 'Notes',
            phase_sort_order: 999,
          });
          continue;
        }
        const phase = phaseMap.get(task.phase_id);
        enrichedNotes.push({
          id: note.id,
          content: note.content,
          updated_at: note.updated_at,
          sprint_task_id: note.sprint_task_id,
          task_title: task.title,
          day_number: task.day_number,
          phase_id: task.phase_id,
          phase_title: phase?.title || 'Unknown Phase',
          phase_sort_order: phase?.sort_order ?? 999,
        });
      }

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

      const groups = Array.from(groupMap.values())
        .sort((a, b) => a.phase_sort_order - b.phase_sort_order);

      for (const group of groups) {
        group.notes.sort((a, b) => a.day_number - b.day_number);
      }

      return groups;
    },
  });
};
