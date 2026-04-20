import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientActionItem {
  id: string;
  client_user_id: string;
  text: string;
  is_completed: boolean;
  created_by: string;
  created_at: string;
  due_date: string | null;
  completed_at: string | null;
}

export const useClientActionItems = (clientUserId: string) => {
  const queryClient = useQueryClient();
  const qk = ['client-action-items', clientUserId];

  const { data: items = [], isLoading } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_action_items')
        .select('*')
        .eq('client_user_id', clientUserId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data as any[]) as ClientActionItem[];
    },
    enabled: !!clientUserId,
  });

  const addItem = useMutation({
    mutationFn: async ({ text, createdBy, dueDate }: { text: string; createdBy: string; dueDate?: string | null }) => {
      const payload: any = { client_user_id: clientUserId, text, created_by: createdBy };
      if (dueDate) payload.due_date = dueDate;
      const { error } = await supabase
        .from('client_action_items')
        .insert(payload);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const toggleItem = useMutation({
    mutationFn: async (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      const { error } = await supabase
        .from('client_action_items')
        .update({ is_completed: !item.is_completed } as any)
        .eq('id', itemId);
      if (error) throw error;
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: qk });
      const prev = queryClient.getQueryData<ClientActionItem[]>(qk);
      queryClient.setQueryData<ClientActionItem[]>(qk, (old = []) =>
        old.map((i) => (i.id === itemId ? { ...i, is_completed: !i.is_completed, completed_at: !i.is_completed ? new Date().toISOString() : null } : i))
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(qk, context?.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const updateItem = useMutation({
    mutationFn: async ({ itemId, dueDate }: { itemId: string; dueDate: string | null }) => {
      const { error } = await supabase
        .from('client_action_items')
        .update({ due_date: dueDate } as any)
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('client_action_items')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk }),
  });

  return { items, isLoading, addItem, toggleItem, deleteItem, updateItem };
};
