import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Trophy, Clock, ChevronDown, ClipboardCheck } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MobilePhaseCardProps {
  phase: any;
  tasks: any[];
  isLocked: boolean;
  unlockDate?: Date;
  isExpanded: boolean;
  onToggle: () => void;
  onTaskClick: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  onRestartTask?: (taskId: string) => void;
  quizRequirement?: any;
  quizAccessible?: boolean;
  onStartQuiz?: () => void;
}

export const MobilePhaseCard = ({
  phase,
  tasks,
  isLocked,
  unlockDate,
  isExpanded,
  onToggle,
  onTaskClick,
  onStartTask,
  onRestartTask,
  quizRequirement,
  quizAccessible = true,
  onStartQuiz,
}: MobilePhaseCardProps) => {
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const percentage = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const isCompleted = percentage === 100;

  return (
    <Card 
      id={`phase-${phase.id}`}
      className={`transition-all ${isLocked ? 'opacity-60' : 'opacity-100'}`}
    >
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">Phase {phase.phase_order}</h3>
              {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
              {isCompleted && !isLocked && <Trophy className="h-4 w-4 text-amber-500" />}
            </div>
            <p className="text-base font-semibold">{phase.title}</p>
            {phase.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {phase.description}
              </p>
            )}
          </div>
          <ChevronDown 
            className={cn(
              "h-5 w-5 text-muted-foreground transition-transform shrink-0",
              isExpanded && "rotate-180"
            )}
          />
        </div>

        {isLocked && (
          <div className="mt-2 flex flex-wrap gap-2">
            {unlockDate && (
              <Badge variant="secondary" className="gap-2">
                <Clock className="h-3 w-3" />
                Unlocks {formatDistanceToNow(unlockDate, { addSuffix: true })}
              </Badge>
            )}
            {quizRequirement && quizRequirement.quizzes && (
              <Badge variant="secondary" className="gap-2">
                <ClipboardCheck className="h-3 w-3" />
                Quiz Required: {quizRequirement.quizzes.title}
              </Badge>
            )}
          </div>
        )}

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedTasks}/{tasks.length} tasks
            </span>
            <span className="font-semibold text-primary">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {isLocked && quizRequirement && quizRequirement.quizzes && onStartQuiz && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <ClipboardCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-1">Quiz Required</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Complete "{quizRequirement.quizzes.title}" to unlock this phase.
                  </p>
                  {quizAccessible ? (
                    <Button onClick={onStartQuiz} size="sm" className="gap-2 w-full">
                      <ClipboardCheck className="h-4 w-4" />
                      Start Quiz
                    </Button>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="w-full block">
                            <Button size="sm" className="gap-2 w-full" disabled>
                              <ClipboardCheck className="h-4 w-4" />
                              Quiz Locked
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Complete the previous phase exam first</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </div>
          )}
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              status={task.status}
              dueInfo={task.dueInfo}
              onStartTask={onStartTask}
              onClick={onTaskClick}
              onRestartTask={onRestartTask}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
};
