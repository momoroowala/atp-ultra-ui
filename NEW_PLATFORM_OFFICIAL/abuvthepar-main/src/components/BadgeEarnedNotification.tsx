import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const BadgeEarnedNotification = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Set up real-time subscription for new badges
    const channel = supabase
      .channel('badge-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievement_badges',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Fetch the badge details
          const { data: badgeData } = await supabase
            .from('achievement_badges')
            .select('*')
            .eq('id', payload.new.badge_id)
            .single();

          if (badgeData) {
            // Dispatch custom event for BadgeCelebrationModal
            window.dispatchEvent(new CustomEvent('badge-earned', {
              detail: {
                badge_name: badgeData.badge_name,
                icon_emoji: badgeData.icon_emoji,
                description: badgeData.description,
                points_value: badgeData.points_value,
              },
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null; // This is a notification-only component
};
