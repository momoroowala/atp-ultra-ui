import { forwardRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Lock, Clock, ClipboardCheck } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { TaskStatus } from '@/utils/taskStatusHelper';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_description: string | null;
  points: number;
  duration_minutes: number | null;
  task_type: string;
  status: TaskStatus;
  dueInfo: any;
  phases?: {
    title: string;
  };
  discipline_task_sections?: any[];
  discipline_task_form_fields?: any[];
}

interface TasksPanelProps {
  phaseTitle: string;
  phaseDescription?: string;
  phaseOrder?: number;
  tasks: Task[];
  completedCount: number;
  onTaskClick: (taskId: string) => void;
  onStartTask: (taskId: string) => void;
  onRestartTask?: (taskId: string) => void;
  onWatchVideos?: () => void;
  hasVideos?: boolean;
  isLocked?: boolean;
  unlockDate?: Date;
  quizRequirement?: any;
  quizAccessible?: boolean;
  onStartQuiz?: () => void;
}

export const TasksPanel = forwardRef<HTMLDivElement, TasksPanelProps>(({
  phaseTitle,
  phaseDescription,
  phaseOrder,
  tasks,
  onRestartTask,
  completedCount,
  onTaskClick,
  onStartTask,
  onWatchVideos,
  hasVideos = false,
  isLocked = false,
  unlockDate,
  quizRequirement,
  quizAccessible = true,
  onStartQuiz,
}, ref) => {
  const totalTasks = tasks.length;
  const percentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const videoCount = tasks.filter(t => t.task_type === 'video').length;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold">
              {phaseOrder && `Phase ${phaseOrder}: `}{phaseTitle}
            </h2>
            {isLocked && <Lock className="h-5 w-5 text-muted-foreground" />}
          </div>
          
          {phaseDescription && (
            <p className="text-muted-foreground mb-3">{phaseDescription}</p>
          )}

          {isLocked && quizRequirement && quizRequirement.quizzes && (
            <div className="mb-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <ClipboardCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-foreground mb-1">Quiz Required to Unlock This Phase</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Complete "{quizRequirement.quizzes.title}" to unlock this phase and access all tasks.
                  </p>
                  {onStartQuiz && (
                    quizAccessible ? (
                      <Button onClick={onStartQuiz} size="sm" className="gap-2">
                        <ClipboardCheck className="h-4 w-4" />
                        Start Quiz
                      </Button>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button size="sm" className="gap-2" disabled>
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
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {isLocked && !quizRequirement && unlockDate && (
            <div className="mb-3 p-3 bg-muted/30 rounded-lg">
              <Badge variant="secondary" className="gap-2">
                <Clock className="h-3 w-3" />
                Unlocks {formatDistanceToNow(unlockDate, { addSuffix: true })}
              </Badge>
            </div>
          )}
          
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 mt-3">
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalTasks} tasks completed
            </span>
            <Progress value={percentage} className="h-2 w-full transition-all duration-500 ease-out" />
            <span className="text-sm font-semibold text-primary">{percentage}%</span>
          </div>
        </div>

        {hasVideos && videoCount > 0 && (
          <Button
            variant="secondary"
            onClick={onWatchVideos}
            className="w-full gap-2"
          >
            <Video className="h-4 w-4" />
            Watch Phase Videos ({videoCount})
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1" ref={ref}>
        <div className="p-6 space-y-4">
          {isLocked && quizRequirement ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ClipboardCheck className="h-16 w-16 text-primary/40 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Quiz Required</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                You must complete the "{quizRequirement.quizzes.title}" quiz to unlock this phase and access the tasks.
              </p>
              {onStartQuiz && (
                quizAccessible ? (
                  <Button onClick={onStartQuiz} size="lg" className="gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Start Quiz Now
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button size="lg" className="gap-2" disabled>
                            <ClipboardCheck className="h-5 w-5" />
                            Quiz Locked
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Complete the previous phase exam first</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              )}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tasks in this phase yet.
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                status={task.status}
                dueInfo={task.dueInfo}
                onStartTask={onStartTask}
                onClick={onTaskClick}
                onRestartTask={onRestartTask}
              />
            ))
          )}
        </div>
        
        {/* Extra spacing equivalent to one phase card height */}
        <div className="h-48" />
      </ScrollArea>
    </div>
  );
});

TasksPanel.displayName = 'TasksPanel';
