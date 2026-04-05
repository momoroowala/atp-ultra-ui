import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Unlock, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Phase } from '@/hooks/usePhasesWithTasks';
import { cn } from '@/lib/utils';

interface PhaseCardProps {
  phase: Phase;
  isUnlocked: boolean;
  isPendingUnlock?: boolean;
  completedTasks: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export const PhaseCard = ({
  phase,
  isUnlocked,
  isPendingUnlock = false,
  completedTasks,
  isSelected,
  onClick,
}: PhaseCardProps) => {
  const totalTasks = phase.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const isCompleted = completedTasks === totalTasks && totalTasks > 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      className={cn(
        'transition-all cursor-pointer hover:shadow-lg pointer-events-auto',
        isSelected && 'ring-2 ring-primary',
        !isUnlocked && !isPendingUnlock && 'opacity-80',
        isPendingUnlock && 'border-yellow-500/50 bg-yellow-500/5'
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <Badge variant="outline" className="text-xs">
            Phase {phase.phase_order}
          </Badge>
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : isPendingUnlock ? (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          ) : isUnlocked ? (
            <Unlock className="h-5 w-5 text-primary" />
          ) : (
            <Lock className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <CardTitle className="text-lg">{phase.title}</CardTitle>
        {isPendingUnlock && (
          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
            Quiz Required
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {phase.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {phase.description}
          </p>
        )}
        
        {isUnlocked && (
          <>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {completedTasks}/{totalTasks} modules
              </span>
              <span>{phase.points} pts</span>
            </div>
          </>
        )}
        
        {isPendingUnlock && (
          <div className="text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {totalTasks} modules • {phase.points} pts
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
