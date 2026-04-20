import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRealtimeTicketResponses(
  ticketId: string | null,
  queryKeys: string[][]
) {
  const qc = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!ticketId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    processedRef.current.clear();

    const invalidateAll = (payload: any) => {
      const eventKey = `${payload.table}-${payload.eventType}-${payload.new?.id || payload.old?.id || Date.now()}`;
      if (processedRef.current.has(eventKey)) return;
      processedRef.current.add(eventKey);
      if (processedRef.current.size > 100) {
        const entries = Array.from(processedRef.current);
        processedRef.current = new Set(entries.slice(-50));
      }

      for (const key of queryKeys) {
        qc.refetchQueries({ queryKey: key, type: 'active' });
      }
      qc.invalidateQueries({ queryKey: ['support-notification-count'] });
    };

    const channel = supabase
      .channel(`ticket-rt-${ticketId}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_responses', filter: `ticket_id=eq.${ticketId}` }, invalidateAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_internal_notes', filter: `ticket_id=eq.${ticketId}` }, invalidateAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_metadata', filter: `ticket_id=eq.${ticketId}` }, invalidateAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets', filter: `id=eq.${ticketId}` }, invalidateAll)
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [ticketId]); // eslint-disable-line react-hooks/exhaustive-deps
}
