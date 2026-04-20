import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp } from 'lucide-react';
import { Phase } from '@/hooks/usePhasesWithTasks';

interface OverallProgressCardProps {
  phases: Phase[];
  unlockedPhaseIds: string[];
  completedTasks: number;
  totalTasks: number;
  totalPoints: number;
}

export const OverallProgressCard = ({
  phases,
  unlockedPhaseIds,
  completedTasks,
  totalTasks,
  totalPoints,
}: OverallProgressCardProps) => {
  const unlockedPhases = phases.filter(p => unlockedPhaseIds.includes(p.id));
  const completedPhases = unlockedPhases.filter(phase => {
    const allTasksCompleted = phase.tasks.length > 0 && 
      phase.tasks.every(task => task.is_active);
    return allTasksCompleted;
  });

  const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const currentPhase = unlockedPhases.find(phase => 
    phase.tasks.some(task => task.is_active)
  );

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card/95 to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Your Learning Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-2xl font-bold">{Math.round(overallProgress)}%</p>
            <p className="text-sm text-muted-foreground">Overall Completion</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-2xl font-bold">{completedPhases.length}/{unlockedPhases.length}</p>
            <p className="text-sm text-muted-foreground">Phases Complete</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-2xl font-bold flex items-center gap-1">
              <Trophy className="h-5 w-5 text-amber-500" />
              {totalPoints}
            </p>
            <p className="text-sm text-muted-foreground">Total Points</p>
          </div>
        </div>

        <Progress value={overallProgress} className="h-3" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {completedTasks} of {totalTasks} tasks completed
          </span>
          {currentPhase && (
            <Badge variant="secondary" className="ml-auto">
              Current: {currentPhase.title}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
