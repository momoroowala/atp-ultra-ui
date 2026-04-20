import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth"; // session guard

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
  phone: string | null;
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
  enabled?: boolean;
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
  const { session } = useAuth();
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
    guaranteeFilter = 'all',
    enabled = true
  } = options;

  return useQuery({
    queryKey: ['all-users-progress', page, perPage, searchQuery, tierFilter, roleFilter, levelFilter, statusFilter, courseFilter, invitationFilter, sortColumn, sortDirection, csmFilter, onboardingFilter, guaranteeFilter],
    staleTime: 5 * 60_000, // 5 minutes — admin list doesn't need to re-fetch on every nav
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    enabled: !!session?.access_token && enabled,
    queryFn: async (): Promise<UseAllUsersProgressResult> => {
      console.log('🔄 Fetching users progress via edge function with filters:', { 
        page, perPage, searchQuery, tierFilter, roleFilter, levelFilter, statusFilter, courseFilter, invitationFilter, sortColumn, sortDirection, csmFilter, onboardingFilter, guaranteeFilter 
      });
      
      const { data: response, error } = await supabase.functions.invoke('list-users', {
        body: { 
          page, 
          perPage, 
          search: searchQuery, 
          tierFilter,
          roleFilter,
          levelFilter,
          statusFilter,
          courseFilter,
          invitationFilter,
          sortColumn,
          sortDirection,
          csmFilter,
          onboardingFilter,
          guaranteeFilter
        }
      });

      if (error) {
        console.error('Failed to fetch users:', error);
        throw error;
      }

      if (!response || !response.users) {
        console.error('No users data returned:', response);
        return {
          users: [],
          pagination: { page: 1, perPage, totalCount: 0, totalPages: 0 }
        };
      }

      const usersWithProgress: UserProgress[] = response.users.map((user: any) => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        tier: user.tier,
        tierId: user.tier_id,
        roleKey: normalizeRoleKey(user.role),
        role: user.role,
        roleId: user.role_id,
        isActive: user.is_active,
        level: user.level,
        points: user.points,
        totalTasks: user.total_tasks,
        completedTasks: user.completed_tasks,
        overdueTasks: 0,
        dueSoonTasks: 0,
        joinedDate: user.created_at,
        progressPercentage: user.progress_percentage,
        lastSignInAt: user.last_sign_in_at || null,
        assignedCsmId: user.assigned_csm_id || null,
        onboardingCompleted: user.onboarding_completed ?? false,
        onboardingDate: user.onboarding_date || null,
        offboardingDate: user.offboarding_date || null,
        guaranteeStatus: user.guarantee_status || 'pending',
        onboardingBookingStatus: user.onboarding_booking_status || null,
        revenue: user.revenue ?? null,
        phone: user.phone || null,
      }));

      console.log(`✨ Received ${usersWithProgress.length} users with progress from edge function`);

      return {
        users: usersWithProgress,
        pagination: response.pagination,
      };
    },
  });
};
