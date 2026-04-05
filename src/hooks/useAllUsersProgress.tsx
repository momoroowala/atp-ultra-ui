import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const normalizeRoleKey = (role: string | null | undefined): string =>
  (role || '').toLowerCase().replace(/\s+/g, '_');

export interface UserProgress {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: string;
  tierId: string | null;
  roleKey: string;
  role: string;
  roleId: string | null;
  isActive: boolean;
  level: number;
  points: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  joinedDate: string;
  progressPercentage: number;
  lastSignInAt: string | null;
  assignedCsmId: string | null;
  onboardingCompleted: boolean;
  onboardingDate: string | null;
  offboardingDate: string | null;
  guaranteeStatus: string;
  onboardingBookingStatus: string | null;
  revenue: number | null;
}

export interface UseAllUsersProgressOptions {
  page?: number;
  perPage?: number;
  searchQuery?: string;
  tierFilter?: string[];
  roleFilter?: string;
  levelFilter?: string;
  statusFilter?: string;
  courseFilter?: string[];
  invitationFilter?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  csmFilter?: string | null;
  onboardingFilter?: string;
  guaranteeFilter?: string;
}

export interface UseAllUsersProgressResult {
  users: UserProgress[];
  pagination: {
    page: number;
    perPage: number;
    totalCount: number;
    totalPages: number;
  };
}

export const useAllUsersProgress = (options: UseAllUsersProgressOptions = {}) => {
  const { 
    page = 1, 
    perPage = 15, 
    searchQuery = '', 
    tierFilter = [],
    roleFilter = 'all',
    levelFilter = 'all',
    statusFilter = 'all',
    courseFilter = [],
    invitationFilter = 'all',
    sortColumn = 'first_name',
    sortDirection = 'asc',
    csmFilter = null,
    onboardingFilter = 'all',
    guaranteeFilter = 'all'
  } = options;

  return useQuery({
    queryKey: ['all-users-progress', page, perPage, searchQuery, tierFilter, roleFilter, levelFilter, statusFilter, courseFilter, invitationFilter, sortColumn, sortDirection, csmFilter, onboardingFilter, guaranteeFilter],
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<UseAllUsersProgressResult> => {
      // DEV MODE: Direct query instead of list-users edge function (not deployed)
      // TODO: Switch back to edge function when deployed
      let query = supabase
        .from('user_profiles')
        .select(`
          id, user_email, first_name, last_name, is_active, created_at,
          tier_id, tiers(display_name, tier_key),
          role_id, roles(display_name, role_key)
        `, { count: 'exact' });

      if (searchQuery) {
        query = query.or(`user_email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`);
      }
      if (statusFilter === 'active') query = query.eq('is_active', true);
      if (statusFilter === 'inactive') query = query.eq('is_active', false);

      const offset = (page - 1) * perPage;
      query = query.range(offset, offset + perPage - 1).order('created_at', { ascending: sortDirection === 'asc' });

      const { data: profiles, error: profileError, count } = await query;
      if (profileError) throw profileError;
      if (!profiles) return { users: [], pagination: { page: 1, perPage, totalCount: 0, totalPages: 0 } };

      // Get task counts
      const userIds = profiles.map((p: any) => p.id);
      const { data: totalTasksData } = await supabase.from('tasks').select('id', { count: 'exact' }).eq('is_active', true);
      const totalTasks = totalTasksData?.length || 0;

      const { data: completions } = await supabase
        .from('task_responses')
        .select('user_id')
        .in('user_id', userIds)
        .eq('status', 'completed');

      const completionsByUser: Record<string, number> = {};
      for (const c of completions || []) {
        completionsByUser[c.user_id] = (completionsByUser[c.user_id] || 0) + 1;
      }

      // Get login streaks for last_sign_in approximation
      const { data: streaks } = await supabase
        .from('user_login_streaks')
        .select('user_id, last_login_date, current_streak, total_logins')
        .in('user_id', userIds);

      const streaksByUser: Record<string, any> = {};
      for (const s of streaks || []) {
        streaksByUser[s.user_id] = s;
      }

      const usersWithProgress: UserProgress[] = profiles.map((user: any) => {
        const roleData = Array.isArray(user.roles) ? user.roles[0] : user.roles;
        const tierData = Array.isArray(user.tiers) ? user.tiers[0] : user.tiers;
        const completed = completionsByUser[user.id] || 0;
        const streak = streaksByUser[user.id];

        return {
          id: user.id,
          email: user.user_email || '',
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          tier: tierData?.display_name || '',
          tierId: user.tier_id,
          roleKey: normalizeRoleKey(roleData?.role_key),
          role: roleData?.display_name || '',
          roleId: user.role_id,
          isActive: user.is_active ?? true,
          level: 0,
          points: 0,
          totalTasks: totalTasks,
          completedTasks: completed,
          overdueTasks: 0,
          dueSoonTasks: 0,
          joinedDate: user.created_at,
          progressPercentage: totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0,
          lastSignInAt: streak?.last_login_date ? new Date(streak.last_login_date).toISOString() : null,
          assignedCsmId: null,
          onboardingCompleted: false,
          onboardingDate: null,
          offboardingDate: null,
          guaranteeStatus: 'pending',
          onboardingBookingStatus: null,
          revenue: null,
        };
      });

      return {
        users: usersWithProgress,
        pagination: {
          page,
          perPage,
          totalCount: count || profiles.length,
          totalPages: Math.ceil((count || profiles.length) / perPage),
        },
      };
    },
  });
};
