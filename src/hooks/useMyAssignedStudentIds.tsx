import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Lightweight hook that returns IDs and emails of active client students
 * assigned to the currently logged-in CSM (auth.user.id).
 * Independent of the CSM filter dropdown used in the Students table.
 */
export function useMyAssignedStudentIds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-assigned-student-ids', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_email, roles!inner(role_key)')
        .eq('assigned_csm_id', user!.id)
        .eq('is_active', true);

      if (error) throw error;

      const clients = (data || []).filter((p: any) => {
        const roleKey = Array.isArray(p.roles) ? p.roles[0]?.role_key : p.roles?.role_key;
        return roleKey === 'client';
      });

      const ids = new Set(clients.map((p: any) => p.id as string));
      const emails = new Set(clients.map((p: any) => (p.user_email as string)?.toLowerCase()).filter(Boolean));

      return { ids, emails };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}
