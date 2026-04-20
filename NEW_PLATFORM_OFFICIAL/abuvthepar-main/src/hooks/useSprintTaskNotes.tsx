import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useSprintTaskNotes = (sprintTaskId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedRef = useRef('');

  // Fetch note on mount / task change
  useEffect(() => {
    if (!user?.id || !sprintTaskId) {
      setContent('');
      return;
    }
    setLoading(true);
    setSaved(false);
    supabase
      .from('sprint_task_notes' as any)
      .select('content')
      .eq('user_id', user.id)
      .eq('sprint_task_id', sprintTaskId)
      .maybeSingle()
      .then(({ data }) => {
        const val = (data as any)?.content ?? '';
        setContent(val);
        lastSavedRef.current = val;
        setLoading(false);
      });
  }, [user?.id, sprintTaskId]);

  // Upsert helper
  const save = useCallback(
    async (text: string) => {
      if (!user?.id || !sprintTaskId || text === lastSavedRef.current) return;
      await (supabase.from('sprint_task_notes' as any) as any).upsert(
        {
          user_id: user.id,
          sprint_task_id: sprintTaskId,
          content: text,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,sprint_task_id' }
      );
      lastSavedRef.current = text;
      queryClient.invalidateQueries({ queryKey: ['my-notes'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    [user?.id, sprintTaskId, queryClient]
  );

  // Debounced update
  const updateContent = useCallback(
    (text: string) => {
      setContent(text);
      setSaved(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => save(text), 800);
    },
    [save]
  );

  // Cleanup
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return { content, updateContent, loading, saved };
};
