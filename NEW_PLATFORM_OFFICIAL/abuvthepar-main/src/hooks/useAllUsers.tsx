import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BasicUser {
  id: string;
  user_email: string;
  first_name: string | null;
  last_name: string | null;
}

export const useAllUsers = () => {
  return useQuery({
    queryKey: ['all-users-basic'],
    staleTime: 60_000, // Cache for 1 minute
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_email, first_name, last_name')
        .eq('is_active', true)
        .order('first_name', { ascending: true })
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Failed to fetch users:', error);
        throw error;
      }

      return data as BasicUser[];
    },
  });
};
