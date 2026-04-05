import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ScheduledMessage {
  id: string;
  sender_id: string;
  channel_id: string | null;
  dm_conversation_id: string | null;
  content: string;
  attachments: any[];
  mentions: string[];
  scheduled_at: string;
  timezone: string;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_end_date: string | null;
  status: string;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledMessageInput {
  content: string;
  channel_id?: string;
  dm_conversation_id?: string;
  attachments?: any[];
  mentions?: string[];
  scheduled_at: string;
  timezone: string;
  is_recurring?: boolean;
  recurrence_pattern?: string;
  recurrence_end_date?: string;
}

export const useScheduledMessages = (channelId?: string, dmConversationId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['scheduled-messages', channelId || dmConversationId];

  const scheduledQuery = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('scheduled_messages')
        .select('*')
        .eq('sender_id', user!.id)
        .eq('status', 'pending')
        .order('scheduled_at', { ascending: true });

      if (channelId) {
        query = query.eq('channel_id', channelId);
      } else if (dmConversationId) {
        query = query.eq('dm_conversation_id', dmConversationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ScheduledMessage[];
    },
    enabled: !!user && !!(channelId || dmConversationId),
  });

  const createScheduledMessage = useMutation({
    mutationFn: async (input: CreateScheduledMessageInput) => {
      const { data, error } = await supabase
        .from('scheduled_messages')
        .insert({
          sender_id: user!.id,
          content: input.content,
          channel_id: input.channel_id || null,
          dm_conversation_id: input.dm_conversation_id || null,
          attachments: JSON.stringify(input.attachments || []),
          mentions: input.mentions || [],
          scheduled_at: input.scheduled_at,
          timezone: input.timezone,
          is_recurring: input.is_recurring || false,
          recurrence_pattern: input.recurrence_pattern || null,
          recurrence_end_date: input.recurrence_end_date || null,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const cancelScheduledMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('scheduled_messages')
        .update({ status: 'cancelled' } as any)
        .eq('id', messageId)
        .eq('sender_id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Scheduled message cancelled');
    },
  });

  return {
    scheduledMessages: scheduledQuery.data || [],
    isLoading: scheduledQuery.isLoading,
    createScheduledMessage,
    cancelScheduledMessage,
  };
};
