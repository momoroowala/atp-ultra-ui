import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LoginStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_login_date: string;
  total_logins: number;
  created_at: string;
  updated_at: string;
}

export const useLoginStreak = () => {
  const { user } = useAuth();

  const { data: streak, isLoading } = useQuery({
    queryKey: ['login-streak', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_login_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no streak exists, it will be created on first login
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data as LoginStreak;
    },
    enabled: !!user,
  });

  return {
    streak,
    currentStreak: streak?.current_streak || 0,
    longestStreak: streak?.longest_streak || 0,
    totalLogins: streak?.total_logins || 0,
    loading: isLoading,
  };
};
