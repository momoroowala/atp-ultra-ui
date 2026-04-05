import { Card, CardContent } from '@/components/ui/card';
import { useLoginStreak } from '@/hooks/useLoginStreak';
import { Flame } from 'lucide-react';

export const LoginStreakDisplay = () => {
  const { currentStreak, longestStreak, loading } = useLoginStreak();

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Flame className="h-8 w-8 text-primary" />
            {currentStreak > 0 && (
              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {currentStreak}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Login Streak</p>
            <p className="text-2xl font-bold text-primary">
              {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
            </p>
            {longestStreak > currentStreak && (
              <p className="text-xs text-muted-foreground">
                Best: {longestStreak} days
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
