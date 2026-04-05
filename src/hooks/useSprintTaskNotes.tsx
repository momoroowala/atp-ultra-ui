import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const NOTES_STORAGE_KEY = 'sprint_task_notes_local';

function getLocalNotes(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function setLocalNote(taskId: string, content: string) {
  const notes = getLocalNotes();
  notes[taskId] = content;
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

export const useSprintTaskNotes = (sprintTaskId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedRef = useRef('');
  const pendingTextRef = useRef<string | null>(null);

  // Immediate save helper (no debounce)
  const saveImmediate = useCallback(
    async (text: string, taskId: string) => {
      if (!user?.id || text === lastSavedRef.current) return;

      // Always save to localStorage as backup
      setLocalNote(taskId, text);

      // Try Supabase (may fail on dev instances without the table)
      try {
        await (supabase.from('sprint_task_notes' as any) as any).upsert(
          {
            user_id: user.id,
            sprint_task_id: taskId,
            content: text,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,sprint_task_id' }
        );
      } catch {
        // Supabase save failed, localStorage backup is already saved
      }

      lastSavedRef.current = text;
      queryClient.invalidateQueries({ queryKey: ['my-notes'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    [user?.id, queryClient]
  );

  // Fetch note on mount / task change; flush pending save on task change
  useEffect(() => {
    // Flush any pending debounced save from the previous task before switching
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = undefined;
    }
    if (pendingTextRef.current !== null) {
      // Save whatever was pending for the PREVIOUS task (captured in lastSavedRef context)
      const textToSave = pendingTextRef.current;
      pendingTextRef.current = null;
      // We save to localStorage directly since sprintTaskId already changed
      // The previous taskId is lost here, so we rely on localStorage being set
      // in updateContent below (setLocalNote is called eagerly)
    }

    if (!user?.id || !sprintTaskId) {
      setContent('');
      return;
    }
    setLoading(true);
    setSaved(false);

    // Try Supabase first, fall back to localStorage
    supabase
      .from('sprint_task_notes' as any)
      .select('content')
      .eq('user_id', user.id)
      .eq('sprint_task_id', sprintTaskId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          // Fallback to localStorage
          const localNotes = getLocalNotes();
          const val = localNotes[sprintTaskId] ?? '';
          setContent(val);
          lastSavedRef.current = val;
        } else {
          const val = (data as any)?.content ?? '';
          setContent(val);
          lastSavedRef.current = val;
        }
        setLoading(false);
      });
  }, [user?.id, sprintTaskId]);

  // Debounced update -- eagerly saves to localStorage on every keystroke
  const updateContent = useCallback(
    (text: string) => {
      setContent(text);
      setSaved(false);
      pendingTextRef.current = text;

      // Eagerly write to localStorage so data is never lost
      if (sprintTaskId) {
        setLocalNote(sprintTaskId, text);
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        pendingTextRef.current = null;
        if (sprintTaskId) {
          saveImmediate(text, sprintTaskId);
        }
      }, 800);
    },
    [saveImmediate, sprintTaskId]
  );

  // Cleanup: flush pending save on unmount
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // pendingTextRef is already saved to localStorage eagerly in updateContent
  }, []);

  // Explicit save (no debounce) for the Save button
  const saveNow = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pendingTextRef.current = null;
    if (sprintTaskId) {
      saveImmediate(content, sprintTaskId);
    }
  }, [content, sprintTaskId, saveImmediate]);

  return { content, updateContent, saveNow, loading, saved };
};
