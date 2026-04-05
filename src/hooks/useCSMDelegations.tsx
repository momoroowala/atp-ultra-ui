import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Delegation {
  id: string;
  original_csm_id: string;
  delegate_csm_id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  original_csm?: { first_name: string | null; last_name: string | null };
  delegate_csm?: { first_name: string | null; last_name: string | null };
}

export function useMyDelegation() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['csm-delegation', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<{ asOriginator: Delegation | null; asDelegate: Delegation | null }> => {
      // Fetch as originator
      const { data: origData } = await supabase
        .from('csm_delegations')
        .select('*')
        .eq('original_csm_id', user!.id)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false })
        .limit(1);

      // Fetch as delegate
      const { data: delData } = await supabase
        .from('csm_delegations')
        .select('*')
        .eq('delegate_csm_id', user!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      const origRow = (origData?.[0] as any) || null;
      const delRow = (delData?.[0] as any) || null;

      // Fetch names for the counterpart CSMs
      const idsToFetch = new Set<string>();
      if (origRow) idsToFetch.add(origRow.delegate_csm_id);
      if (delRow) idsToFetch.add(delRow.original_csm_id);

      let profileMap: Record<string, { first_name: string | null; last_name: string | null }> = {};
      if (idsToFetch.size > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name')
          .in('id', Array.from(idsToFetch));
        for (const p of profiles || []) {
          profileMap[p.id] = { first_name: p.first_name, last_name: p.last_name };
        }
      }

      return {
        asOriginator: origRow ? { ...origRow, delegate_csm: profileMap[origRow.delegate_csm_id] } : null,
        asDelegate: delRow ? { ...delRow, original_csm: profileMap[delRow.original_csm_id] } : null,
      };
    },
  });
}

export function useCreateDelegation() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { delegate_csm_id: string; start_date: string; end_date: string }) => {
      const { error } = await supabase.from('csm_delegations').insert({
        original_csm_id: user!.id,
        delegate_csm_id: params.delegate_csm_id,
        start_date: params.start_date,
        end_date: params.end_date,
        status: 'pending',
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['csm-delegation'] }),
  });
}

export function useCancelDelegation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (delegationId: string) => {
      // First check status
      const { data } = await supabase
        .from('csm_delegations')
        .select('status')
        .eq('id', delegationId)
        .single();

      if ((data as any)?.status === 'active') {
        // Revert via RPC
        const { error } = await supabase.rpc('revert_csm_delegation', { p_delegation_id: delegationId });
        if (error) throw error;
      } else {
        // Just cancel
        const { error } = await supabase
          .from('csm_delegations')
          .update({ status: 'cancelled' } as any)
          .eq('id', delegationId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['csm-delegation'] }),
  });
}
