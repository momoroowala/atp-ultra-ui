import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Lightweight hook that returns the count of DM conversations with unread messages
 * for the current user, without loading full conversation data.
 */
export function useUnreadDMCount(): number {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ['unread-dm-count', user?.id],
    queryFn: async () => {
      // Get conversations where this user is a participant
      const { data: participants, error: pError } = await supabase
        .from('community_dm_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user!.id);

      if (pError || !participants || participants.length === 0) return 0;

      // For each conversation, check if there are messages after last_read_at
      let unreadCount = 0;
      for (const p of participants) {
        let query = supabase
          .from('community_messages')
          .select('id', { count: 'exact', head: true })
          .eq('dm_conversation_id', p.conversation_id)
          .neq('sender_id', user!.id);

        if (p.last_read_at) {
          query = query.gt('created_at', p.last_read_at);
        }

        const { count } = await query;
        if (count && count > 0) unreadCount++;
      }

      return unreadCount;
    },
    enabled: !!user?.id,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  return data ?? 0;
}
