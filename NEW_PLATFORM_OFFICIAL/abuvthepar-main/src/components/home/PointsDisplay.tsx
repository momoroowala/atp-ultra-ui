import { useAuth } from '@/hooks/useAuth';
import { useAchievementBadges } from '@/hooks/useAchievementBadges';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface PointsBreakdown {
  activity_type: string;
  count: number;
  total_points: number;
}

export const PointsDisplay = () => {
  const { user } = useAuth();
  const { totalPoints: achievementPoints } = useAchievementBadges();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['user-points', user?.id],
    queryFn: async () => {
      if (!user) return { activityPoints: 0, breakdown: [] };

      const { data: points } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id);

      if (!points) return { activityPoints: 0, breakdown: [] };

      const total = points.reduce((sum, p) => sum + p.points, 0);

      // Group by activity type
      const grouped = points.reduce((acc, point) => {
        const existing = acc.find(item => item.activity_type === point.activity_type);
        if (existing) {
          existing.count++;
          existing.total_points += point.points;
        } else {
          acc.push({
            activity_type: point.activity_type,
            count: 1,
            total_points: point.points
          });
        }
        return acc;
      }, [] as PointsBreakdown[]);

      return { activityPoints: total, breakdown: grouped };
    },
    enabled: !!user,
  });

  const activityPoints = data?.activityPoints || 0;
  const breakdown = data?.breakdown || [];
  const totalPoints = activityPoints + achievementPoints;

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      'video_completed': 'Videos Completed',
      'homework_submitted': 'Homework Submitted',
      'exam_passed': 'Exams Passed',
      'streak_milestone': 'Streak Milestones',
      'community_participation': 'Community Participation'
    };
    return labels[type] || type;
  };

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
          <Star className="h-4 w-4 text-yellow-500" />
          Your Points
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
          <p className="text-4xl font-bold">{totalPoints}</p>
          <p className="text-sm text-muted-foreground mt-1">Total Points</p>
        </div>

        {breakdown.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Breakdown</h4>
            {breakdown.slice(0, 3).map((item) => (
              <div
                key={item.activity_type}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <span className="text-sm truncate">{getActivityLabel(item.activity_type)}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {item.count}x
                  </Badge>
                  <span className="text-sm font-semibold">{item.total_points}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Earn Points</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Complete videos (+10)</li>
            <li>• Submit homework (+25)</li>
            <li>• Pass exams (+50)</li>
            <li>• Login streak (+5/day)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};