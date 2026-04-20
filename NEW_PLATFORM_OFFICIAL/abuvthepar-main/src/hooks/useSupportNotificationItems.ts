import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SupportNotificationItem {
  id: string;
  ticket_id: string;
  notification_type: string;
  message: string | null;
  created_at: string;
  ticket_subject: string | null;
  is_read: boolean;
}

export function useSupportNotificationItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['support-notification-items', user?.id],
    queryFn: async (): Promise<SupportNotificationItem[]> => {
      const { data: notifications, error } = await supabase
        .from('support_notifications')
        .select('id, ticket_id, notification_type, message, created_at, is_read')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      if (!notifications || notifications.length === 0) return [];

      const ticketIds = [...new Set(notifications.map((n) => n.ticket_id))];
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('id, subject')
        .in('id', ticketIds);

      const ticketMap = new Map(tickets?.map((t) => [t.id, t.subject]) || []);

      return notifications.map((n) => ({
        ...n,
        is_read: n.is_read ?? false,
        ticket_subject: ticketMap.get(n.ticket_id) || null,
      }));
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchInterval: 30000,
  });
}
