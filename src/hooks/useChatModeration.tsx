import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface FlaggedMessage {
  id: string;
  content: string;
  sender_id: string;
  channel_id: string | null;
  dm_conversation_id: string | null;
  created_at: string;
  is_flagged: boolean;
  is_hidden: boolean;
  ai_flagged: boolean;
  flag_reason: string | null;
  flagged_by: string | null;
  moderation_status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  sender?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    user_email: string | null;
    avatar_url: string | null;
  };
  channel?: {
    name: string;
  } | null;
}

export interface BlockedUser {
  id: string;
  user_id: string;
  blocked_by: string;
  reason: string;
  blocked_at: string;
  is_active: boolean;
  user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    user_email: string | null;
    avatar_url: string | null;
  };
}

export const useChatModeration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch flagged messages (for admins)
  const flaggedMessagesQuery = useQuery({
    queryKey: ['flagged-messages'],
    queryFn: async () => {
      console.log('[ChatModeration] Fetching flagged messages...');
      const { data: messages, error } = await supabase
        .from('community_messages')
        .select('*')
        .eq('is_flagged', true)
        .eq('moderation_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ChatModeration] Error fetching flagged messages:', error);
        throw error;
      }
      
      console.log('[ChatModeration] Found flagged messages:', messages?.length || 0, messages);

      if (!messages || messages.length === 0) return [];

      // Fetch sender details
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const channelIds = [...new Set(messages.filter(m => m.channel_id).map(m => m.channel_id))] as string[];

      const [{ data: senders }, { data: channels }] = await Promise.all([
        supabase.from('user_profiles').select('id, first_name, last_name, user_email, avatar_url').in('id', senderIds),
        channelIds.length > 0 
          ? supabase.from('community_channels').select('id, name').in('id', channelIds)
          : { data: [] as { id: string; name: string }[] },
      ]);

      const senderMap = new Map((senders || []).map(s => [s.id, s]));
      const channelMap = new Map((channels || []).map(c => [c.id, c]));

      return messages.map(m => ({
        ...m,
        sender: senderMap.get(m.sender_id),
        channel: m.channel_id ? channelMap.get(m.channel_id) : null,
      })) as FlaggedMessage[];
    },
    enabled: !!user,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always refetch
  });

  // Fetch blocked users (for admins)
  const blockedUsersQuery = useQuery({
    queryKey: ['blocked-users'],
    queryFn: async () => {
      const { data: blocked, error } = await supabase
        .from('community_blocked_users')
        .select('*')
        .eq('is_active', true)
        .order('blocked_at', { ascending: false });

      if (error) throw error;

      // Fetch user details
      const userIds = [...new Set(blocked?.map(b => b.user_id) || [])];
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, user_email, avatar_url')
        .in('id', userIds);

      const userMap = new Map(users?.map(u => [u.id, u]) || []);

      return (blocked || []).map(b => ({
        ...b,
        user: userMap.get(b.user_id),
      })) as BlockedUser[];
    },
    enabled: !!user,
  });

  // Check if current user is blocked
  const isBlockedQuery = useQuery({
    queryKey: ['user-blocked-status', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_blocked_users')
        .select('id, reason')
        .eq('user_id', user?.id!)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data;
    },
    enabled: !!user,
  });

  // Release message (make visible)
  const releaseMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('community_messages')
        .update({
          is_hidden: false,
          moderation_status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flagged-messages'] });
      // Reset (remove + mark stale) all community message queries
      // so they refetch fresh data including the released message
      queryClient.resetQueries({ queryKey: ['community-messages'] });
      toast.success('Message released');
    },
    onError: () => {
      toast.error('Failed to release message');
    },
  });

  // Keep message hidden (reject)
  const rejectMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('community_messages')
        .update({
          moderation_status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flagged-messages'] });
      toast.success('Message rejected');
    },
    onError: () => {
      toast.error('Failed to reject message');
    },
  });

  // Block user
  const blockUser = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const { error } = await supabase
        .from('community_blocked_users')
        .upsert({
          user_id: userId,
          blocked_by: user?.id,
          reason,
          is_active: true,
          blocked_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      toast.success('User blocked');
    },
    onError: () => {
      toast.error('Failed to block user');
    },
  });

  // Unblock user
  const unblockUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('community_blocked_users')
        .update({
          is_active: false,
          unblocked_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      toast.success('User unblocked');
    },
    onError: () => {
      toast.error('Failed to unblock user');
    },
  });

  // Flag message (for regular users)
  const flagMessage = useMutation({
    mutationFn: async ({ messageId, reason }: { messageId: string; reason: string }) => {
      const { error } = await supabase
        .from('community_messages')
        .update({
          is_flagged: true,
          is_hidden: true,
          flagged_by: user?.id,
          flag_reason: reason,
          moderation_status: 'pending',
        })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-messages'] });
      toast.success('Message reported for review');
    },
    onError: () => {
      toast.error('Failed to report message');
    },
  });

  return {
    flaggedMessages: flaggedMessagesQuery.data ?? [],
    flaggedMessagesLoading: flaggedMessagesQuery.isLoading,
    blockedUsers: blockedUsersQuery.data ?? [],
    blockedUsersLoading: blockedUsersQuery.isLoading,
    isBlocked: isBlockedQuery.data,
    isBlockedLoading: isBlockedQuery.isLoading,
    releaseMessage,
    rejectMessage,
    blockUser,
    unblockUser,
    flagMessage,
    refetchFlagged: flaggedMessagesQuery.refetch,
    refetchBlocked: blockedUsersQuery.refetch,
  };
};
