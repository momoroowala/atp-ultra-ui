import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export function useActivityTracker() {
  const { user } = useAuth();
  const location = useLocation();
  const lastPing = useRef<number>(0);

  const ping = useCallback(async () => {
    if (!user) return;
    const now = Date.now();
    if (now - lastPing.current < THROTTLE_MS) return;
    lastPing.current = now;

    await supabase
      .from('user_profiles')
      .update({ last_active_at: new Date().toISOString() } as any)
      .eq('id', user.id);
  }, [user]);

  // Ping on route change
  useEffect(() => {
    ping();
  }, [location.pathname, ping]);

  // Ping on visibility change (user returns to tab)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        ping();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [ping]);
}
