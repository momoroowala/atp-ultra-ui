import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CallRsvp {
  id: string;
  call_id: string;
  user_id: string;
  status: 'yes' | 'no';
  created_at: string;
  updated_at: string;
}

export const useCallRsvps = (callId: string | undefined) => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['call-rsvps', callId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_rsvps' as any)
        .select('*')
        .eq('call_id', callId!);
      if (error) throw error;
      return (data || []) as unknown as CallRsvp[];
    },
    enabled: !!callId,
    staleTime: 30_000,
  });

  const rsvps = query.data || [];
  const yesCount = rsvps.filter(r => r.status === 'yes').length;
  const noCount = rsvps.filter(r => r.status === 'no').length;
  const currentUserRsvp = rsvps.find(r => r.user_id === user?.id)?.status ?? null;

  return { ...query, rsvps, yesCount, noCount, currentUserRsvp };
};

export const useUpsertRsvp = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ callId, status }: { callId: string; status: 'yes' | 'no' }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('call_rsvps' as any)
        .upsert(
          { call_id: callId, user_id: user.id, status } as any,
          { onConflict: 'call_id,user_id' }
        );
      if (error) throw error;
    },
    onSuccess: (_, { callId }) => {
      queryClient.invalidateQueries({ queryKey: ['call-rsvps', callId] });
      queryClient.invalidateQueries({ queryKey: ['user-rsvp-stats'] });
    },
  });
};

export const useUserRsvpStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-rsvp-stats', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_rsvps' as any)
        .select('status')
        .eq('user_id', userId!);
      if (error) throw error;
      const all = (data || []) as unknown as { status: string }[];
      const yesCount = all.filter(r => r.status === 'yes').length;
      const totalRsvps = all.length;
      return { yesCount, totalRsvps };
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
};

export const useAllCallRsvpCounts = () => {
  return useQuery({
    queryKey: ['all-call-rsvp-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('call_rsvps' as any)
        .select('call_id, status');
      if (error) throw error;
      const all = (data || []) as unknown as { call_id: string; status: string }[];
      const byCall: Record<string, { yes: number; no: number }> = {};
      all.forEach(r => {
        if (!byCall[r.call_id]) byCall[r.call_id] = { yes: 0, no: 0 };
        if (r.status === 'yes') byCall[r.call_id].yes++;
        else byCall[r.call_id].no++;
      });
      return byCall;
    },
    staleTime: 60_000,
  });
};
