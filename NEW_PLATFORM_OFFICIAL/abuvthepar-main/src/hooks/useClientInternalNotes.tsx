import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface InternalNote {
  id: string;
  client_user_id: string;
  author_id: string;
  author_name: string;
  note: string;
  created_at: string;
}

export const useClientInternalNotes = (clientUserId: string) => {
  return useQuery({
    queryKey: ['client-internal-notes', clientUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_internal_notes' as any)
        .select('*')
        .eq('client_user_id', clientUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as InternalNote[];
    },
    enabled: !!clientUserId,
  });
};

export const useAddClientNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientUserId, authorId, authorName, note }: {
      clientUserId: string;
      authorId: string;
      authorName: string;
      note: string;
    }) => {
      const { error } = await supabase
        .from('client_internal_notes' as any)
        .insert({
          client_user_id: clientUserId,
          author_id: authorId,
          author_name: authorName,
          note,
        } as any);
      if (error) throw error;
    },
    onSuccess: (_, { clientUserId }) => {
      queryClient.invalidateQueries({ queryKey: ['client-internal-notes', clientUserId] });
    },
  });
};

export const useDeleteClientNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noteId, clientUserId }: { noteId: string; clientUserId: string }) => {
      const { error } = await supabase
        .from('client_internal_notes' as any)
        .delete()
        .eq('id', noteId);
      if (error) throw error;
      return clientUserId;
    },
    onSuccess: (clientUserId) => {
      queryClient.invalidateQueries({ queryKey: ['client-internal-notes', clientUserId] });
    },
  });
};
