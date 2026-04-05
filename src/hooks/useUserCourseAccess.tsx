import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUserCourseAccess = (userId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: userAccess, isLoading } = useQuery({
    queryKey: ['user-course-access', userId],
    queryFn: async () => {
      if (!userId) return [];

      // First get the access records
      const { data: accessData, error: accessError } = await supabase
        .from('user_course_access')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (accessError) throw accessError;
      if (!accessData) return [];

      // Get course details for each access record
      const accessWithDetails = await Promise.all(
        accessData.map(async (access) => {
          // Get course details
          const { data: courseData } = await supabase
            .from('courses')
            .select('*')
            .eq('id', access.course_id)
            .single();

          // Get granted_by user profile if exists
          let grantedByProfile = null;
          if (access.granted_by) {
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('id, user_email, first_name, last_name')
              .eq('id', access.granted_by)
              .single();
            grantedByProfile = profileData;
          }

          return {
            ...access,
            courses: courseData,
            granted_by_profile: grantedByProfile,
          };
        })
      );

      return accessWithDetails;
    },
    enabled: !!userId,
  });

  const grantAccess = useMutation({
    mutationFn: async ({ courseId, notes }: { courseId: string; notes?: string }) => {
      if (!userId) throw new Error('User ID is required');

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('user_course_access')
        .insert([{
          user_id: userId,
          course_id: courseId,
          granted_by: user?.id,
          access_type: 'granted',
          notes,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-course-access', userId] });
      toast.success('Course access granted successfully');
    },
    onError: (error) => {
      toast.error('Failed to grant course access');
      console.error('Error granting access:', error);
    },
  });

  const revokeAccess = useMutation({
    mutationFn: async (courseId: string) => {
      if (!userId) throw new Error('User ID is required');

      const { error } = await supabase
        .from('user_course_access')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-course-access', userId] });
      toast.success('Course access revoked successfully');
    },
    onError: (error) => {
      toast.error('Failed to revoke course access');
      console.error('Error revoking access:', error);
    },
  });

  return { userAccess, isLoading, grantAccess, revokeAccess };
};
