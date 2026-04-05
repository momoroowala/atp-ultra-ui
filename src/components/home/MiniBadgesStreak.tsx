import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Award } from 'lucide-react';

interface BadgeData {
  badge_name: string;
  earned_at: string;
}

interface StreakData {
  current_streak: number;
}

export const MiniBadgesStreak = () => {
  const { user } = useAuth();
  const [lastBadge, setLastBadge] = useState<BadgeData | null>(null);
  const [streak, setStreak] = useState<StreakData>({ current_streak: 0 });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load last earned badge
    const { data: badges } = await supabase
      .from('user_achievement_badges')
      .select('awarded_at, badge_id, achievement_badges(badge_name)')
      .eq('user_id', user.id)
      .order('awarded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (badges && badges.achievement_badges) {
      setLastBadge({
        badge_name: (badges.achievement_badges as any).badge_name,
        earned_at: badges.awarded_at || '',
      });
    }

    const { data: streakData } = await supabase
      .from('user_login_streaks')
      .select('current_streak')
      .eq('user_id', user.id)
      .maybeSingle();

    if (streakData) {
      setStreak({ current_streak: streakData.current_streak || 0 });
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="text-lg font-bold">{streak.current_streak} days</p>
            </div>
          </div>
          
          {lastBadge && (
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Last Badge</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {lastBadge.badge_name}
                </Badge>
              </div>
            </div>
          )}
          
          {!lastBadge && (
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground">No badges yet</p>
                <p className="text-xs text-muted-foreground">Keep learning!</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
