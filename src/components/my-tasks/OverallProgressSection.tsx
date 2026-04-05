import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star } from 'lucide-react';

interface OverallProgressSectionProps {
  completedTasks: number;
  totalTasks: number;
  totalPoints: number;
  userLevel?: number;
}

export const OverallProgressSection = ({
  completedTasks,
  totalTasks,
  totalPoints,
  userLevel = 1,
}: OverallProgressSectionProps) => {
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-primary/20">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Progress</h2>
              <p className="text-muted-foreground mt-1">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{percentage}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>

          <Progress value={percentage} className="h-3" />

          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="gap-1.5 py-1.5">
              <Trophy className="h-4 w-4" />
              Level {userLevel}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1.5">
              <Star className="h-4 w-4" />
              {totalPoints} XP earned
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
