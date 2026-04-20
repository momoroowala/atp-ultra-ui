import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useRef } from 'react';

export function useSupportNotificationCount() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const queryKey = ['support-notification-count', user?.id];

  const { data: count = 0, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('support_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
    staleTime: 0,
  });

  useEffect(() => {
    if (!user?.id) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`support-notifs-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_notifications',
        },
        (payload) => {
          const newRow = payload.new as any;
          const oldRow = payload.old as any;
          const isRelevant = newRow?.user_id === user.id || oldRow?.user_id === user.id;
          if (!isRelevant) return;

          if (payload.eventType === 'INSERT' && newRow?.is_read === false) {
            qc.setQueryData(queryKey, (prev: number | undefined) => (prev ?? 0) + 1);
          }
          qc.invalidateQueries({ queryKey });
          qc.invalidateQueries({ queryKey: ['support-notification-items'] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { count, isLoading };
}

export function useMarkSupportNotificationsRead() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const { error } = await supabase
        .from('support_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.setQueryData(['support-notification-count', user?.id], 0);
      qc.invalidateQueries({ queryKey: ['support-notification-count'] });
      qc.invalidateQueries({ queryKey: ['support-notification-items'] });
    },
  });
}

export async function createSupportNotification(
  userId: string,
  ticketId: string,
  notificationType: string,
  message?: string
) {
  const { error } = await supabase
    .from('support_notifications')
    .insert({
      user_id: userId,
      ticket_id: ticketId,
      notification_type: notificationType,
      message: message || null,
    });
  if (error) console.error('[createSupportNotification] Error:', error);
}
