import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
// confetti and toast are now handled by BadgeCelebrationModal via custom events

export interface AchievementBadge {
  id: string;
  badge_key: string;
  badge_name: string;
  description: string | null;
  category: 'onboarding' | 'learning' | 'community' | 'consistency' | 'special';
  tier: string;
  icon_emoji: string;
  points_value: number;
  requirement_type: string | null;
  requirement_value: any;
  auto_award: boolean;
  is_active: boolean;
}

export interface UserAchievementBadge extends AchievementBadge {
  earned_at: string;
  user_badge_id: string;
}

export const useAchievementBadges = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all available badges
  const { data: allBadges = [], isLoading: loadingAll } = useQuery({
    queryKey: ['achievement-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_badges')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('points_value', { ascending: true });

      if (error) throw error;
      return data as AchievementBadge[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - badges rarely change
  });

  // Fetch user's earned badges
  const { data: earnedBadges = [], isLoading: loadingEarned } = useQuery({
    queryKey: ['user-achievement-badges', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_achievement_badges')
        .select(`
          id,
          awarded_at,
          badge:achievement_badges (
            id,
            badge_key,
            badge_name,
            description,
            category,
            tier,
            icon_emoji,
            points_value,
            requirement_type,
            requirement_value,
            auto_award,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .order('awarded_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        ...item.badge,
        earned_at: item.awarded_at,
        user_badge_id: item.id,
      })) as UserAchievementBadge[];
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes - badges rarely change
  });

  // Check for new badges
  const checkBadgesMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');

      // Capture current earned badge IDs before the check
      const previousBadgeIds = new Set(earnedBadges.map(b => b.id));

      const { error } = await supabase.rpc('check_and_award_achievement_badges', {
        p_user_id: user.id,
      });

      if (error) throw error;

      return previousBadgeIds;
    },
    onSuccess: async (previousBadgeIds) => {
      // Refetch earned badges to detect new ones
      const { data } = await supabase
        .from('user_achievement_badges')
        .select(`
          id,
          awarded_at,
          badge:achievement_badges (
            id,
            badge_key,
            badge_name,
            description,
            category,
            tier,
            icon_emoji,
            points_value,
            requirement_type,
            requirement_value,
            auto_award,
            is_active
          )
        `)
        .eq('user_id', user!.id)
        .order('awarded_at', { ascending: false });

      if (data) {
        const now = new Date();
        const sixtySecondsAgo = new Date(now.getTime() - 60_000);

        const newBadges = data
          .filter((item: any) => {
            // Only consider badges awarded in the last 60 seconds
            const awardedAt = new Date(item.awarded_at);
            return awardedAt >= sixtySecondsAgo;
          })
          .map((item: any) => item.badge)
          .filter((badge: any) => badge && !previousBadgeIds.has(badge.id));

        // Guard: if previous state was empty and we got multiple "new" badges, they're pre-existing
        if (newBadges.length > 0 && !(previousBadgeIds.size === 0 && newBadges.length > 1)) {
          newBadges.forEach((badge: any) => {
            window.dispatchEvent(new CustomEvent('badge-earned', {
              detail: {
                badge_name: badge.badge_name,
                icon_emoji: badge.icon_emoji || '🏆',
                description: badge.description,
                points_value: badge.points_value,
              },
            }));
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['user-achievement-badges'] });
    },
    onError: (error: Error) => {
      console.error('Failed to check badges:', error.message);
    },
  });

  // Update login streak
  const updateLoginStreakMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No user');

      const { error } = await supabase.rpc('update_login_streak', {
        p_user_id: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      checkBadgesMutation.mutate();
    },
    onError: (error: Error) => {
      console.error('Failed to update login streak:', error.message);
    },
  });

  // Calculate stats
  const earnedBadgeIds = new Set(earnedBadges.map(b => b.badge_key));
  const lockedBadges = allBadges.filter(b => !earnedBadgeIds.has(b.badge_key));
  
  const totalPoints = earnedBadges.reduce((sum, badge) => sum + (badge.points_value || 0), 0);
  
  const recentBadges = earnedBadges.filter((badge) => {
    const earnedDate = new Date(badge.earned_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return earnedDate >= sevenDaysAgo;
  });

  const badgesByCategory = allBadges.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, AchievementBadge[]>);

  const earnedByCategory = earnedBadges.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = 0;
    acc[badge.category]++;
    return acc;
  }, {} as Record<string, number>);

  return {
    allBadges,
    earnedBadges,
    lockedBadges,
    totalPoints,
    recentBadges,
    badgesByCategory,
    earnedByCategory,
    loading: loadingAll || loadingEarned,
    checkBadges: () => checkBadgesMutation.mutate(),
    updateLoginStreak: () => updateLoginStreakMutation.mutate(),
  };
};
