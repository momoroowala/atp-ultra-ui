import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface BrandLeadStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  assignedCsmId: string | null;
}

/**
 * Lightweight hook that fetches only the fields needed for Brand Leads
 * filter dropdowns: id, name, email, assigned_csm_id.
 * Replaces the heavy useCSMStudents (list-users edge fn) + useMyAssignedStudentIds.
 */
export function useBrandLeadStudents(options: {
  csmId?: string;
  enabled?: boolean;
}) {
  const { user } = useAuth();
  const { csmId, enabled = true } = options;

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['brand-lead-students', csmId || user?.id],
    queryFn: async () => {
      let query = supabase
        .from('user_profiles')
        .select('id, first_name, last_name, user_email, assigned_csm_id, roles!inner(role_key)')
        .eq('is_active', true);

      if (csmId) {
        query = query.eq('assigned_csm_id', csmId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || [])
        .filter((p: any) => {
          const roleKey = Array.isArray(p.roles) ? p.roles[0]?.role_key : p.roles?.role_key;
          return roleKey === 'client';
        })
        .map((p: any) => ({
          id: p.id,
          firstName: p.first_name || '',
          lastName: p.last_name || '',
          email: p.user_email || '',
          assignedCsmId: p.assigned_csm_id || null,
        }));
    },
    enabled: enabled && !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Profile map for owner name resolution (avoids separate user_profiles fetch in useBrandLeads)
  const profileMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of students) {
      const name = [s.firstName, s.lastName].filter(Boolean).join(' ');
      if (name) map.set(s.id, name);
    }
    return map;
  }, [students]);

  // Set of student IDs (replaces useMyAssignedStudentIds)
  const studentIds = useMemo(() => new Set(students.map(s => s.id)), [students]);

  return { students, studentIds, profileMap, isLoading };
}
