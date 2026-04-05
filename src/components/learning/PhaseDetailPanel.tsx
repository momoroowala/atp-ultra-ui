import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TaskItem } from './TaskItem';
import { PhaseUnlockInfo } from './PhaseUnlockInfo';
import { Phase } from '@/hooks/usePhasesWithTasks';
import { Trophy, BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PhaseDetailPanelProps {
  phase: Phase | null;
  isUnlocked: boolean;
  isPendingUnlock?: boolean;
  quizTitle?: string;
  taskStatuses: Record<string, string>;
  userCreatedAt: string;
  onTaskClick: (taskId: string) => void;
}

export const PhaseDetailPanel = ({
  phase,
  isUnlocked,
  isPendingUnlock = false,
  quizTitle,
  taskStatuses,
  userCreatedAt,
  onTaskClick,
}: PhaseDetailPanelProps) => {
  const navigate = useNavigate();
  if (!phase) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-2">
          <BookOpen className="h-12 w-12 mx-auto opacity-50" />
          <p>Select a phase to view details</p>
        </div>
      </div>
    );
  }

  const completedTasks = phase.tasks.filter(t => taskStatuses[t.id] === 'completed').length;
  const progressPercentage = phase.tasks.length > 0 
    ? Math.round((completedTasks / phase.tasks.length) * 100) 
    : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="p-6 pb-4 border-b shrink-0 bg-card">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <Badge variant="outline">Phase {phase.phase_order}</Badge>
            <h1 className="text-2xl font-bold">{phase.title}</h1>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Trophy className="h-3 w-3" />
            {phase.points} pts
          </Badge>
        </div>
        
        {isUnlocked && (
          <div className="text-sm text-muted-foreground">
            {completedTasks}/{phase.tasks.length} tasks completed
            <span className="ml-2 font-medium text-primary">{progressPercentage}%</span>
          </div>
        )}

        {!isUnlocked && quizTitle && (
          <Alert className="mt-4 border-yellow-500/50 bg-yellow-500/10">
            <BookOpen className="h-5 w-5 text-yellow-600" />
            <AlertTitle className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
              Quiz Required to Unlock
            </AlertTitle>
            <AlertDescription className="mt-2 space-y-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Complete the <strong>{quizTitle}</strong> to unlock this phase.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {!isUnlocked && !quizTitle && (
          <PhaseUnlockInfo
            phaseId={phase.id}
            unlockType={phase.unlock_type}
            unlockCondition={phase.unlock_condition}
            userCreatedAt={userCreatedAt}
          />
        )}
      </div>

      {/* Scrollable Task List */}
      {isUnlocked && (
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-3">
            {phase.tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                status={taskStatuses[task.id] || 'pending'}
                onClick={() => onTaskClick(task.id)}
              />
            ))}
            {/* Extra spacing equivalent to one task card height */}
            <div className="h-24" />
          </div>
        </ScrollArea>
      )}
      
      {!isUnlocked && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-md">
            <p className="text-muted-foreground">
              {phase.tasks.length} tasks worth {phase.points} points are waiting for you.
            </p>
            {quizTitle && (
              <Button 
                onClick={() => navigate('/home')}
                size="lg"
              >
                Take Quiz to Unlock
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
