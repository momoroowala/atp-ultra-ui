import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FathomNote {
  id: string;
  call_id: string | null;
  recording_id: string | null;
  fathom_recording_id: string;
  meeting_title: string | null;
  summary: string | null;
  transcript: any;
  action_items: any;
  fathom_meeting_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useFathomNotes = (recordingId: string | null | undefined) => {
  return useQuery({
    queryKey: ['fathom-notes', recordingId],
    queryFn: async () => {
      if (!recordingId) return null;
      const { data, error } = await (supabase as any)
        .from('fathom_meeting_notes')
        .select('*')
        .eq('recording_id', recordingId)
        .maybeSingle();

      if (error) throw error;
      return data as FathomNote | null;
    },
    enabled: !!recordingId,
  });
};

export const useFathomNotesForRecordings = (recordingIds: string[]) => {
  return useQuery({
    queryKey: ['fathom-notes-batch', recordingIds],
    queryFn: async () => {
      if (recordingIds.length === 0) return [];
      const { data, error } = await (supabase as any)
        .from('fathom_meeting_notes')
        .select('recording_id')
        .in('recording_id', recordingIds);

      if (error) throw error;
      return (data || []).map((d: any) => d.recording_id as string);
    },
    enabled: recordingIds.length > 0,
  });
};
