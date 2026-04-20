import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DMConversation {
  id: string;
  name: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  participantCount: number;
  participants: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    user_email: string | null;
    avatar_url: string | null;
  }[];
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  } | null;
  unread_count?: number;
}

export const useCommunityDMs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ['community-dm-conversations'],
    queryFn: async (): Promise<DMConversation[]> => {
      // Single RPC replaces the previous per-conversation fan-out
      // (participants + profiles + fallback profiles + last message + unread count).
      // The function is SECURITY INVOKER so RLS still scopes visibility.
      const { data, error } = await supabase.rpc('get_dm_conversations' as any);

      if (error) {
        console.error('[useCommunityDMs] RPC failed:', error);
        throw error;
      }

      const rows = (data || []) as Array<{
        conversation_id: string;
        conversation_name: string | null;
        created_at: string;
        updated_at: string;
        last_message_at: string;
        last_message_content: string | null;
        last_message_sender_id: string | null;
        last_message_created_at: string | null;
        other_participants: Array<{
          id: string;
          first_name: string | null;
          last_name: string | null;
          user_email: string | null;
          avatar_url: string | null;
        }> | null;
        unread_count: number;
      }>;

      return rows.map((row) => ({
        id: row.conversation_id,
        name: row.conversation_name,
        created_at: row.created_at,
        updated_at: row.updated_at,
        last_message_at: row.last_message_at,
        participantCount: (row.other_participants || []).length,
        participants: (row.other_participants || []).map((p) => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          user_email: p.user_email,
          avatar_url: p.avatar_url,
        })),
        last_message: row.last_message_content
          ? {
              content: row.last_message_content,
              sender_id: row.last_message_sender_id!,
              created_at: row.last_message_created_at!,
            }
          : null,
        unread_count: Number(row.unread_count) || 0,
      }));
    },
    enabled: !!user,
    refetchOnMount: 'always',
    refetchInterval: 5000,
  });

  const createOrGetDM = useMutation({
    mutationFn: async (otherUserId: string) => {
      // Check if a 1:1 conversation already exists with this user
      const { data: targetUserConvs } = await supabase
        .from('community_dm_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId);

      if (targetUserConvs && targetUserConvs.length > 0) {
        const { data: myParticipation } = await supabase
          .from('community_dm_participants')
          .select('conversation_id')
          .eq('user_id', user?.id!)
          .in('conversation_id', targetUserConvs.map(c => c.conversation_id));

          if (myParticipation && myParticipation.length > 0) {
          // Find a true 1:1 (unnamed conversation with exactly 2 participants)
          for (const conv of myParticipation) {
            const { data: convData } = await supabase
              .from('community_dm_conversations')
              .select('name')
              .eq('id', conv.conversation_id)
              .maybeSingle();

            // Must be unnamed AND have exactly 2 participants
            if (!convData?.name) {
              const { count } = await supabase
                .from('community_dm_participants')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.conversation_id);

              if (count === 2) {
                return { id: conv.conversation_id, isNew: false };
              }
            }
          }
        }
      }

      // Create new conversation
      const newConversationId = crypto.randomUUID();

      const { error: convError } = await supabase
        .from('community_dm_conversations')
        .insert({ id: newConversationId } as any);

      if (convError) throw convError;

      // Add current user first (plain INSERT)
      const { error: selfError } = await supabase
        .from('community_dm_participants')
        .insert({ conversation_id: newConversationId, user_id: user?.id! });

      if (selfError) throw selfError;

      // Add the other user
      const { error: partError } = await supabase
        .from('community_dm_participants')
        .insert({ conversation_id: newConversationId, user_id: otherUserId });

      if (partError) throw partError;

      return { id: newConversationId, isNew: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-dm-conversations'] });
    },
    onError: (error) => {
      toast.error('Failed to create conversation');
      console.error('Create DM error:', error);
    },
  });

  const createGroupDM = useMutation({
    mutationFn: async ({ userIds, name }: { userIds: string[]; name?: string }) => {
      const newConversationId = crypto.randomUUID();

      const insertData: any = { id: newConversationId };
      if (name?.trim()) insertData.name = name.trim();

      const { error: convError } = await supabase
        .from('community_dm_conversations')
        .insert(insertData);

      if (convError) throw convError;

      // Add current user first
      const { error: selfError } = await supabase
        .from('community_dm_participants')
        .insert({ conversation_id: newConversationId, user_id: user?.id! });

      if (selfError) throw selfError;

      // Add all selected users
      const participants = userIds.map(uid => ({
        conversation_id: newConversationId,
        user_id: uid,
      }));

      const { error: partError } = await supabase
        .from('community_dm_participants')
        .insert(participants);

      if (partError) throw partError;

      return { id: newConversationId, isNew: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-dm-conversations'] });
    },
    onError: (error) => {
      toast.error('Failed to create group conversation');
      console.error('Create group DM error:', error);
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('community_dm_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user?.id!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-dm-conversations'] });
    },
  });

  const deleteDM = useMutation({
    mutationFn: async (conversationId: string) => {
      // 1. Delete all messages in the conversation
      const { error: msgError } = await supabase
        .from('community_messages')
        .delete()
        .eq('dm_conversation_id', conversationId);
      if (msgError) throw msgError;

      // 2. Delete read status records
      const { error: readError } = await supabase
        .from('community_dm_read_status')
        .delete()
        .eq('conversation_id', conversationId);
      if (readError) throw readError;

      // 3. Delete participants
      const { error: partError } = await supabase
        .from('community_dm_participants')
        .delete()
        .eq('conversation_id', conversationId);
      if (partError) throw partError;

      // 4. Delete the conversation itself
      const { error: convError } = await supabase
        .from('community_dm_conversations')
        .delete()
        .eq('id', conversationId);
      if (convError) throw convError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-dm-conversations'] });
      toast.success('Conversation deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete conversation');
      console.error('Delete DM error:', error);
    },
  });

  const renameConversation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('community_dm_conversations')
        .update({ name: name.trim() || null } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-dm-conversations'] });
      toast.success('Group renamed');
    },
    onError: () => {
      toast.error('Failed to rename group');
    },
  });

  return {
    conversations: conversationsQuery.data ?? [],
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error,
    createOrGetDM,
    createGroupDM,
    markAsRead,
    deleteDM,
    renameConversation,
    refetch: conversationsQuery.refetch,
  };
};
