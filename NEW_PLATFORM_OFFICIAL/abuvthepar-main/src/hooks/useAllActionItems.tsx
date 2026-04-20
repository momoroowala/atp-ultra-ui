import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';

export interface ActionItemWithStudent {
  id: string;
  client_user_id: string;
  text: string;
  is_completed: boolean;
  created_by: string;
  created_at: string;
  due_date: string | null;
  completed_at: string | null;
  student_name: string;
  student_email: string;
  created_by_name: string;
}

export function useAllActionItems() {
  const { user } = useAuth();
  const { isMegaAdmin } = useRoleCheck();

  return useQuery({
    queryKey: ['all-action-items', user?.id, isMegaAdmin],
    queryFn: async (): Promise<ActionItemWithStudent[]> => {
      if (!user) return [];

      // Get assigned student IDs (or all if mega_admin)
      let studentIds: string[] = [];
      if (isMegaAdmin) {
        const { data } = await supabase
          .from('client_action_items')
          .select('client_user_id');
        studentIds = [...new Set((data || []).map((d: any) => d.client_user_id))];
      } else {
        const { data } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('assigned_csm_id', user.id)
          .eq('is_active', true);
        studentIds = (data || []).map((d: any) => d.id);
      }

      if (studentIds.length === 0) return [];

      const { data: items, error } = await supabase
        .from('client_action_items')
        .select('*')
        .in('client_user_id', studentIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!items || items.length === 0) return [];

      // Get student profiles
      const uniqueStudentIds = [...new Set((items as any[]).map(i => i.client_user_id))];
      const uniqueCreatorIds = [...new Set((items as any[]).map(i => i.created_by))];
      const allProfileIds = [...new Set([...uniqueStudentIds, ...uniqueCreatorIds])];

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, user_email')
        .in('id', allProfileIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.id, {
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'User',
          email: p.user_email || '',
        }])
      );

      return (items as any[]).map(item => ({
        ...item,
        student_name: profileMap.get(item.client_user_id)?.name || 'User',
        student_email: profileMap.get(item.client_user_id)?.email || '',
        created_by_name: profileMap.get(item.created_by)?.name || 'User',
      }));
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}
