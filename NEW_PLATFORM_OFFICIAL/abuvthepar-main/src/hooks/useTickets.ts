import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { createTicket, listTickets, getTicket, respondToTicket } from '@/services/ticketApi';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useTickets() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const invalidate = () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
    };

    const channel = supabase
      .channel('client-tickets-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_notifications', filter: `user_id=eq.${user.id}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets', filter: `submitter_user_id=eq.${user.id}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_responses' }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_metadata' }, invalidate)
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return useQuery({
    queryKey: ['tickets', user?.email],
    queryFn: () => listTickets(),
    enabled: !!user?.email,
    refetchInterval: 15000,
  });
}

export function useTicket(ticketId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => getTicket(ticketId!),
    enabled: !!ticketId && !!user?.email,
    refetchInterval: 15000,
    staleTime: 0,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      subject: string;
      description: string;
      priority: string;
      ticketType?: string;
      attachments?: any[];
      topic?: string;
    }) =>
      createTicket(vars.subject, vars.description, vars.priority, vars.ticketType, vars.attachments, vars.topic),
    onSuccess: () => {
      qc.refetchQueries({ queryKey: ['tickets'], type: 'active' });
      qc.invalidateQueries({ queryKey: ['csm-tickets'], exact: false });
    },
  });
}

export function useRespondToTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ticketId: string; message: string; attachments?: Array<{ name: string; url: string; size: number; type: string }> }) =>
      respondToTicket(vars.ticketId, vars.message, vars.attachments),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['ticket', vars.ticketId] });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useUnreadTicketCount() {
  const { data, isLoading } = useTickets();
  const count = (data?.tickets || []).filter(
    (t: any) => t.status === 'waiting_client'
  ).length;
  return { count, isLoading };
}
