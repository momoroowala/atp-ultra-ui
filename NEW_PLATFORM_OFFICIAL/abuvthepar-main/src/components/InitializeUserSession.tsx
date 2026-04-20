import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAchievementBadges } from '@/hooks/useAchievementBadges';
import { useActivityTracker } from '@/hooks/useActivityTracker';

/**
 * Component that initializes user session when they log in
 * - Updates login streak
 * - Checks for new badges
 * - Tracks user activity for accurate "last seen"
 */
export const InitializeUserSession = () => {
  const { user } = useAuth();
  const { updateLoginStreak } = useAchievementBadges();
  const hasInitialized = useRef(false);

  // Track activity globally (throttled to every 5 min)
  useActivityTracker();

  useEffect(() => {
    if (user && !hasInitialized.current) {
      hasInitialized.current = true;
      
      // Update login streak and check for badges
      updateLoginStreak();
    }
  }, [user, updateLoginStreak]);

  return null;
};
