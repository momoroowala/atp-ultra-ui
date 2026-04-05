import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAchievementBadges } from '@/hooks/useAchievementBadges';

/**
 * Component that initializes user session when they log in
 * - Updates login streak
 * - Checks for new badges
 */
export const InitializeUserSession = () => {
  const { user } = useAuth();
  const { updateLoginStreak } = useAchievementBadges();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (user && !hasInitialized.current) {
      hasInitialized.current = true;
      
      // Update login streak and check for badges
      updateLoginStreak();
    }
  }, [user, updateLoginStreak]);

  return null;
};
