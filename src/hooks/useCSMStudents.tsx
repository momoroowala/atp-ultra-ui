import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAllUsersProgress } from '@/hooks/useAllUsersProgress';
import { useRoles } from '@/hooks/useRoles';

export interface CSMStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tier: string;
  tierId: string | null;
  assignedCsmId: string | null;
  isActive: boolean;
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
  lastSignInAt: string | null;
  createdAt: string;
  onboardingBookingStatus: string | null;
  onboardingDate: string | null;
  offboardingDate: string | null;
  guaranteeStatus: string | null;
  revenue: number | null;
}

export interface CSMUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Unified hook that delegates to useAllUsersProgress (list-users edge function)
 * so progress, status, and sign-in data are consistent with User Management.
 */
export function useCSMStudents(csmId?: string) {
  const { user } = useAuth();
  const effectiveCsmId = csmId || user?.id;

  // Resolve student role ID -- look for 'client' or 'user' role key
  const { data: roles } = useRoles();
  const studentRoleId = roles?.find(r => r.role_key === 'client' || r.role_key === 'user')?.id;

  const csmFilterValue = effectiveCsmId === 'unassigned' ? 'unassigned' : (effectiveCsmId || null);

  const { data: usersData, isLoading, error } = useAllUsersProgress({
    perPage: 1000,
    roleFilter: 'all', // DEV: show all users since assigned_csm isn't set up yet
    csmFilter: null, // DEV: don't filter by CSM assignment
    // Don't hard-filter by status — include inactive users so "Refunded" shows
    statusFilter: 'all',
    sortColumn: 'first_name',
    sortDirection: 'asc',
  });

  const students: CSMStudent[] = useMemo(() => {
    if (!usersData?.users) return [];
    return usersData.users.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      tier: u.tier,
      tierId: u.tierId,
      assignedCsmId: u.assignedCsmId,
      isActive: u.isActive,
      completedTasks: u.completedTasks,
      totalTasks: u.totalTasks,
      progressPercentage: u.progressPercentage,
      lastSignInAt: u.lastSignInAt,
      createdAt: u.joinedDate,
      onboardingBookingStatus: u.onboardingBookingStatus,
      onboardingDate: u.onboardingDate,
      offboardingDate: u.offboardingDate,
      guaranteeStatus: u.guaranteeStatus,
      revenue: u.revenue,
    }));
  }, [usersData]);

  return {
    data: students,
    isLoading,
    error,
  };
}

export function useCSMList() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['csm-list'],
    queryFn: async (): Promise<CSMUser[]> => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, user_email, roles!inner(role_key)')
        .eq('is_active', true);

      if (error) throw error;

      return (data || [])
        .filter((p: any) => {
          const roleKey = Array.isArray(p.roles) ? p.roles[0]?.role_key : p.roles?.role_key;
          return roleKey === 'csm';
        })
        .map((p: any) => ({
          id: p.id,
          firstName: p.first_name || '',
          lastName: p.last_name || '',
          email: p.user_email || '',
        }));
    },
    enabled: !!user,
  });
}

export function useAssignCSM() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, csmId }: { userId: string; csmId: string | null }) => {
      const { error } = await supabase.rpc('assign_csm_to_user' as any, {
        p_user_id: userId,
        p_csm_id: csmId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['csm-students'] });
      qc.invalidateQueries({ queryKey: ['all-users-progress'] });
    },
  });
}
