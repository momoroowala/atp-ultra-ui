import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Trophy, Star } from 'lucide-react';

interface OverallProgressCardProps {
  completedCount: number;
  totalTasks: number;
}

export const OverallProgressCard = ({
  completedCount,
  totalTasks,
}: OverallProgressCardProps) => {
  const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const level = Math.floor(completedCount / 3) + 1;
  const xp = completedCount * 50;

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 transition-all duration-300">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold">Your Progress</h3>
          <p className="text-xl font-bold text-primary">{percentage}%</p>
        </div>
        
        <Progress value={percentage} className="h-2 transition-all duration-500 ease-out mb-2" />
        
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {completedCount} of {totalTasks} tasks completed
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <span>Level {level}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-yellow-500" />
              <span>{xp} XP earned</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
