import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Award } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_login_date: string | null;
}

export const StreakTracker = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: streak, isLoading: loading } = useQuery({
    queryKey: ['user-login-streaks', user?.id],
    queryFn: async (): Promise<StreakData> => {
      if (!user) return { current_streak: 0, longest_streak: 0, last_login_date: null };

      const today = new Date().toISOString().split('T')[0];
      
      const { data: existing } = await supabase
        .from('user_login_streaks')
        .select('current_streak, longest_streak, last_login_date')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existing) {
        // Create new streak using the update_login_streak function
        await supabase.rpc('update_login_streak', { p_user_id: user.id });
        return { current_streak: 1, longest_streak: 1, last_login_date: today };
      } else if (existing.last_login_date !== today) {
        // Update streak using the database function
        await supabase.rpc('update_login_streak', { p_user_id: user.id });
        
        const daysDiff = differenceInDays(
          new Date(today),
          new Date(existing.last_login_date || today)
        );

        let newStreak = existing.current_streak || 0;
        
        if (daysDiff === 1) {
          newStreak = (existing.current_streak || 0) + 1;
        } else if (daysDiff > 1) {
          newStreak = 1;
        }

        const newLongest = Math.max(newStreak, existing.longest_streak || 0);

        return {
          current_streak: newStreak,
          longest_streak: newLongest,
          last_login_date: today
        };
      }

      return {
        current_streak: existing.current_streak || 0,
        longest_streak: existing.longest_streak || 0,
        last_login_date: existing.last_login_date
      };
    },
    enabled: !!user,
  });

  const isInactive = (): boolean => {
    if (!streak?.last_login_date) return false;
    const lastLogin = new Date(streak.last_login_date);
    const daysSinceLogin = Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceLogin >= 7;
  };

  const getMotivationalMessage = (currentStreak: number) => {
    if (isInactive()) return "Your streak was reset due to inactivity. Start fresh today! 🔄";
    if (currentStreak === 0) return "Start your journey today! 🚀";
    if (currentStreak === 1) return "Great start! Keep it going! 💪";
    if (currentStreak < 7) return `${7 - currentStreak} days until your first badge! 🔥`;
    if (currentStreak === 7) return "Week complete! You're unstoppable! 🏆";
    return `${currentStreak} days strong! You're crushing it! ⭐`;
  };

  const currentStreak = streak?.current_streak || 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover-lift-subtle hover-border-glow transition-all duration-500">
      <CardHeader className="p-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Flame className="h-4 w-4 text-primary" />
          Login Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold">{currentStreak}</p>
            <p className="text-sm text-muted-foreground">Current</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-yellow-500" />
              <p className="text-2xl font-semibold">{streak?.longest_streak || 0}</p>
            </div>
            <p className="text-sm text-muted-foreground">Best</p>
          </div>
        </div>

        <div className="p-3 bg-primary/10 rounded-lg">
          <p className="text-sm text-center">
            {getMotivationalMessage(currentStreak)}
          </p>
        </div>

        {currentStreak >= 7 && (
          <Badge variant="secondary" className="w-full justify-center text-sm">
            <Flame className="h-4 w-4 mr-1" />
            Streak Master
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};