import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { CommunityMessage } from './useCommunityMessages';

export const useCommunityReactions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const toggleReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      // Check if reaction already exists
      const { data: existing } = await supabase
        .from('community_message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user?.id)
        .eq('emoji', emoji);

      if (existing && existing.length > 0) {
        // Remove reaction
        const { error } = await supabase
          .from('community_message_reactions')
          .delete()
          .eq('id', existing[0].id);

        if (error) throw error;
        return { action: 'removed' as const, emoji, messageId };
      } else {
        // Add reaction
        const { error } = await supabase
          .from('community_message_reactions')
          .insert({
            message_id: messageId,
            user_id: user?.id,
            emoji,
          });

        if (error) throw error;
        return { action: 'added' as const, emoji, messageId };
      }
    },
    onMutate: async ({ messageId, emoji }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['community-messages'] });
      await queryClient.cancelQueries({ queryKey: ['community-thread'] });

      // Snapshot previous state for all message queries
      const previousMessageQueries = queryClient.getQueriesData<CommunityMessage[]>({ 
        queryKey: ['community-messages'] 
      });
      const previousThreadQueries = queryClient.getQueriesData<CommunityMessage[]>({ 
        queryKey: ['community-thread'] 
      });

      const updateMessages = (old: CommunityMessage[] | undefined) => {
        if (!old) return old;
        return old.map((message) => {
          if (message.id !== messageId) return message;

          const reactions = [...(message.reactions || [])];
          const existingReactionIndex = reactions.findIndex(r => r.emoji === emoji);
          const userId = user?.id || '';

          if (existingReactionIndex >= 0) {
            const reaction = reactions[existingReactionIndex];
            const hasUserReacted = reaction.users.includes(userId);

            if (hasUserReacted) {
              const newUsers = reaction.users.filter(u => u !== userId);
              if (newUsers.length === 0) {
                reactions.splice(existingReactionIndex, 1);
              } else {
                reactions[existingReactionIndex] = {
                  ...reaction,
                  count: reaction.count - 1,
                  users: newUsers,
                };
              }
            } else {
              reactions[existingReactionIndex] = {
                ...reaction,
                count: reaction.count + 1,
                users: [...reaction.users, userId],
              };
            }
          } else {
            reactions.push({
              emoji,
              count: 1,
              users: [userId],
            });
          }

          return { ...message, reactions };
        });
      };

      // Optimistically update both message lists and thread replies
      queryClient.setQueriesData<CommunityMessage[]>(
        { queryKey: ['community-messages'] },
        updateMessages
      );
      queryClient.setQueriesData<CommunityMessage[]>(
        { queryKey: ['community-thread'] },
        updateMessages
      );

      return { previousQueries: [...previousMessageQueries, ...previousThreadQueries] };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to update reaction');
      console.error('Toggle reaction error:', error);
    },
    // No onSuccess invalidation - optimistic update handles it
    // Only sync if there's a mismatch (handled by real-time if needed)
  });

  return {
    toggleReaction,
  };
};
