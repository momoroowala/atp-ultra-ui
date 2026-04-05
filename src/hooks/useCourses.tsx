import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserTier } from "./useUserTier";
import { toast } from "sonner";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
  course_order: number;
  visible_tier_ids: string[];
  catalog_visible_tier_ids: string[];
  visible_tiers?: string[]; // Deprecated: kept for backward compatibility
  created_at: string;
  updated_at: string;
  hasAccess?: boolean;
}

export const useCourses = () => {
  const { user, isAdmin, roles } = useAuth();
  const { tierId } = useUserTier();
  const isStaff = roles.some(r => ['admin', 'mega_admin', 'csm', 'executive'].includes(r));

  return useQuery({
    queryKey: ['courses', user?.id, tierId, isAdmin, isStaff],
    queryFn: async () => {
      const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('course_order');

      if (error) throw error;

      // Admin bypass: return all courses with full access
      if (isStaff) {
        return (courses || []).map(course => ({
          ...course,
          catalog_visible_tier_ids: course.catalog_visible_tier_ids || [],
          hasAccess: true,
        })) as Course[];
      }

      // Filter courses by catalog visibility OR manual access grant
      // Logic: Course visible in catalog if:
      // 1. User's tier is in catalog_visible_tier_ids, OR
      // 2. User has been manually granted access (exists in user_course_access)
      const visibleCourses = await Promise.all(
        (courses || []).map(async (course) => {
          const catalogTierIds = (course.catalog_visible_tier_ids && course.catalog_visible_tier_ids.length > 0)
            ? course.catalog_visible_tier_ids
            : (course.visible_tier_ids || []);
          const tierVisible = catalogTierIds.length > 0 && tierId && catalogTierIds.includes(tierId);

          // Check for manual access grant (NOT tier-based access)
          const { data: manualAccess, error: manualAccessError } = await supabase
            .from('user_course_access')
            .select('id')
            .eq('user_id', user!.id)
            .eq('course_id', course.id)
            .maybeSingle();

          if (manualAccessError) {
            console.error('Error checking manual access:', manualAccessError);
          }

          const hasManualGrant = !!manualAccess;

          // Now check full access (tier + manual)
          const { data: hasFullAccess, error: accessError } = await supabase
            .rpc('has_course_access', {
              _user_id: user!.id,
              _course_id: course.id,
            });

          if (accessError) {
            console.error('Error checking course access:', accessError);
          }

          // Course is visible if either tier visible OR has manual grant
          return {
            course,
            visible: tierVisible || hasManualGrant,
            hasAccess: hasFullAccess || false,
          };
        })
      );

      // Filter to only visible courses and return with proper format
      const filteredCourses = visibleCourses
        .filter(({ visible }) => visible)
        .map(({ course, hasAccess }) => ({
          ...course,
          catalog_visible_tier_ids: course.catalog_visible_tier_ids || [],
          hasAccess,
        }));

      return filteredCourses as Course[];
    },
    enabled: !!user && (!!tierId || isStaff),
  });
};

export const useAdminCourses = () => {
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('course_order');

      if (error) throw error;
      
      // Ensure catalog_visible_tier_ids exists for backward compatibility
      return (data as Course[]).map(course => ({
        ...course,
        catalog_visible_tier_ids: course.catalog_visible_tier_ids || []
      }));
    },
  });

  const createCourse = useMutation({
    mutationFn: async (newCourse: Omit<Course, 'id' | 'created_at' | 'updated_at' | 'hasAccess'>) => {
      const { error } = await supabase
        .from('courses')
        .insert([newCourse]);

      if (error) throw error;
      return null;

    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-courses'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['courses'], refetchType: 'active' });
      toast.success('Course created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create course');
      console.error('Error creating course:', error);
    },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Course> }) => {
      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return null;

    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-courses'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['courses'], refetchType: 'active' });
      toast.success('Course updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update course');
      console.error('Error updating course:', error);
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-courses'], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['courses'], refetchType: 'active' });
      toast.success('Course deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete course');
      console.error('Error deleting course:', error);
    },
  });

  return {
    courses,
    isLoading,
    createCourse,
    updateCourse,
    deleteCourse,
  };
};
