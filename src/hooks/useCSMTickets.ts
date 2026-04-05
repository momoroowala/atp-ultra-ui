import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import {
  listAllTickets,
  getTicketAsStaff,
  getTicketMetadata,
  getInternalNotes,
  updateTicketStatus,
  assignTicket,
  addInternalNote,
  editInternalNote,
  deleteInternalNote,
  addTag,
  removeTag,
  escalateTicket,
  closeWithResolution,
  createInternalTicket,
  respondAsStaff,
} from '@/services/ticketApi';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type TicketViewMode = 'csm' | 'admin' | 'mega_admin';

export interface CSMTicketFilters {
  topic?: string;
  status?: string;
  priority?: string;
  type?: string;
  source?: string;
}

export function useCSMTickets(filters?: CSMTicketFilters, viewMode: TicketViewMode = 'csm') {
  const { user } = useAuth();
  const qc = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const invalidateAll = () => {
      qc.invalidateQueries({ queryKey: ['csm-tickets'], exact: false });
    };

    const channel = supabase
      .channel(`csm-tickets-rt-${viewMode}-v2`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_metadata' }, invalidateAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, invalidateAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_notifications' }, invalidateAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_responses' }, invalidateAll)
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const query = useQuery({
    queryKey: ['csm-tickets', viewMode],
    queryFn: async () => {
      const result = await listAllTickets();
      let tickets = result.tickets || [];

      const ticketIds = tickets.map((t: any) => t.id);
      let metadataMap: Record<string, any> = {};

      if (ticketIds.length > 0) {
        const { data: allMetadata } = await supabase
          .from('ticket_metadata')
          .select('*')
          .in('ticket_id', ticketIds);

        if (allMetadata) {
          for (const m of allMetadata) {
            metadataMap[m.ticket_id] = m;
          }
        }
      }

      tickets = tickets.map((t: any) => {
        const meta = metadataMap[t.id];
        return {
          ...t,
          status: meta?.status_override || t.status,
          assigned_to_name: meta?.assigned_to_name || null,
          assigned_to_email: meta?.assigned_to_email || null,
          tags: meta?.tags || [],
          escalated: meta?.escalated || false,
          escalated_at: meta?.escalated_at || null,
          escalated_reason: meta?.escalated_reason || null,
        };
      });

      if (viewMode === 'csm' || viewMode === 'admin') {
        // CSM and Admin views hide bug reports (those go to mega_admin)
        tickets = tickets.filter((t: any) => t.topic !== 'Bug Report');
      }
      // mega_admin view: no filter — sees everything including bug reports

      return { ...result, tickets };
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  const allTickets = query.data?.tickets || [];
  const filteredTickets = allTickets.filter((t: any) => {
    if (filters?.topic && t.topic !== filters.topic) return false;
    if (filters?.priority && t.priority !== filters.priority) return false;
    if (filters?.type) {
      if (filters.type === 'billing' && t.ticket_type !== 'billing') return false;
      if (filters.type === 'internal' && t.internal !== true && t.ticket_type !== 'internal') return false;
      if (filters.type === 'support' && (t.ticket_type !== 'support' || t.internal)) return false;
    }
    if (filters?.source && filters.source !== 'all') {
      if (filters.source === 'client' && (t.internal || t.escalated)) return false;
      if (filters.source === 'internal' && t.internal !== true) return false;
      if (filters.source === 'escalated' && t.escalated !== true) return false;
      if (filters.source === 'staff' && !(t.escalated === true || t.internal === true || t.topic === 'Bug Report')) return false;
    }
    if (filters?.status && t.status !== filters.status) return false;
    return true;
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['csm-tickets'], exact: false });

  return {
    ...query,
    data: query.data ? { ...query.data, tickets: filteredTickets } : undefined,
    refetch: refresh,
  };
}

export function useCSMTicketDetail(ticketId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['csm-ticket', ticketId],
    queryFn: async () => {
      const [ticketResult, metadata, internalNotes] = await Promise.all([
        getTicketAsStaff(ticketId!),
        getTicketMetadata(ticketId!).catch(() => null),
        getInternalNotes(ticketId!).catch(() => []),
      ]);

      const ticket = ticketResult.ticket as any;

      return {
        ...ticketResult,
        ticket: {
          ...ticket,
          status: metadata?.status_override || ticket.status,
          assigned_to_name: metadata?.assigned_to_name || null,
          assigned_to_email: metadata?.assigned_to_email || null,
          tags: (metadata?.tags as string[] | null) || [],
          escalated: metadata?.escalated || false,
          escalated_reason: metadata?.escalated_reason,
          resolution_note: metadata?.resolution_note,
          internal_notes: internalNotes,
        },
      };
    },
    enabled: !!ticketId && !!user,
    refetchInterval: 60000,
    staleTime: 0,
  });
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ticketId: string; status: string }) =>
      updateTicketStatus(vars.ticketId, vars.status),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['csm-ticket', vars.ticketId] });
      qc.invalidateQueries({ queryKey: ['csm-tickets'], exact: false });
    },
  });
}

export function useAssignTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ticketId: string; assigneeEmail: string; assigneeName: string }) =>
      assignTicket(vars.ticketId, vars.assigneeEmail, vars.assigneeName),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['csm-ticket', vars.ticketId] });
      qc.invalidateQueries({ queryKey: ['csm-tickets'], exact: false });
    },
  });
}

export function useAddInternalNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ticketId: string; note: string; attachments?: Array<{ name: string; url: string; size: number; type: string }> }) =>
      addInternalNote(vars.ticketId, vars.note, vars.attachments),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['csm-ticket', vars.ticketId] });
    },
  });
}

export function useEditInternalNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ticketId: string; noteId: string; note: string }) =>
      editInternalNote(vars.noteId, vars.note),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['csm-ticket', vars.ticketId] });
    },
  });
}

export function useDeleteInternalNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ticketId: string; noteId: string }) =>
      deleteInternalNote(vars.noteId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['csm-ticket', vars.ticketId] });
    },
  });
}

export function useAddTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ticketId: string; tag: string }) =>
      addTag(vars.ticketId, vars.tag),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['csm-ticket', vars.ticketId] });
    },
  });
}

export function useRemoveTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ticketId: string; tag: string }) =>
      removeTag(vars.ticketId, vars.tag),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['csm-ticket', vars.ticketId] });
    },
  });
}

export function useEscalateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ticketId: string; reason?: string }) =>
      escalateTicket(vars.ticketId, vars.reason),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['csm-ticket', vars.ticketId] });
      qc.invalidateQueries({ queryKey: ['csm-tickets'], exact: false });
    },
  });
}

export function useCloseWithResolution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ticketId: string; resolutionNote: string }) =>
      closeWithResolution(vars.ticketId, vars.resolutionNote),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['csm-ticket', vars.ticketId] });
      qc.invalidateQueries({ queryKey: ['csm-tickets'], exact: false });
    },
  });
}

export function useCreateInternalTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      subject: string;
      description: string;
      priority: string;
      internalType: string;
      attachments?: Array<{ name: string; url: string; size: number; type: string }>;
    }) =>
      createInternalTicket(vars.subject, vars.description, vars.priority, vars.internalType, vars.attachments),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['csm-tickets'], exact: false });
    },
  });
}

export function useRespondAsStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { ticketId: string; message: string; attachments?: Array<{ name: string; url: string; size: number; type: string }> }) =>
      respondAsStaff(vars.ticketId, vars.message, vars.attachments),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['csm-ticket', vars.ticketId] });
      qc.invalidateQueries({ queryKey: ['csm-tickets'], exact: false });
    },
  });
}
