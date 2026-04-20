import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface CallRecording {
  id: string;
  title: string;
  description: string | null;
  recording_url: string;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  recorded_date: string;
  recorded_time: string | null;
  tags: string[];
  additional_links: any;
  created_by: string;
  is_active: boolean;
  visible_tiers: string[] | null;
  visible_tier_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

// Singleton subscription manager
let recordingsSubscription: RealtimeChannel | null = null;
let subscriberCount = 0;
let globalQueryClient: QueryClient | null = null;

const QUERY_KEY = ['call-recordings'];

const setupRealtimeSubscription = (queryClient: QueryClient) => {
  if (recordingsSubscription) return;

  recordingsSubscription = supabase
    .channel('call_recordings_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'call_recordings',
      },
      () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    )
    .subscribe();
};

const cleanupRealtimeSubscription = () => {
  if (recordingsSubscription && subscriberCount === 0) {
    supabase.removeChannel(recordingsSubscription);
    recordingsSubscription = null;
  }
};

export const useCallRecordings = () => {
  const queryClient = useQueryClient();
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!isSubscribed.current) {
      subscriberCount++;
      globalQueryClient = queryClient;
      setupRealtimeSubscription(queryClient);
      isSubscribed.current = true;
    }

    return () => {
      if (isSubscribed.current) {
        subscriberCount--;
        isSubscribed.current = false;
        setTimeout(cleanupRealtimeSubscription, 1000);
      }
    };
  }, [queryClient]);

  const { data: recordings = [], isLoading, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_recordings')
        .select('*')
        .eq('is_active', true)
        .order('recorded_date', { ascending: false });

      if (error) throw error;
      return data as CallRecording[];
    },
  });

  const createRecording = useMutation({
    mutationFn: async (newRecording: Omit<CallRecording, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('call_recordings').insert({
        ...newRecording,
        created_by: user.id,
      });

      if (error) throw error;
      toast.success('Recording created successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create recording: ${error.message}`);
    },
  });

  const updateRecording = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CallRecording> }) => {
      const { error } = await supabase
        .from('call_recordings')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      toast.success('Recording updated successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update recording: ${error.message}`);
    },
  });

  const deleteRecording = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('call_recordings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Recording deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete recording: ${error.message}`);
    },
  });

  return {
    recordings,
    isLoading,
    createRecording: createRecording.mutate,
    updateRecording: updateRecording.mutate,
    deleteRecording: deleteRecording.mutate,
    refetch,
  };
};
