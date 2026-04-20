import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TaskItem } from './TaskItem';
import { PhaseUnlockInfo } from './PhaseUnlockInfo';
import { Phase } from '@/hooks/usePhasesWithTasks';
import { Lock, Unlock, CheckCircle, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobilePhaseAccordionProps {
  phases: Phase[];
  unlockedPhaseIds: string[];
  phaseProgress: Record<string, number>;
  taskStatuses: Record<string, string>;
  userCreatedAt: string;
  onTaskClick: (taskId: string) => void;
}

export const MobilePhaseAccordion = ({
  phases,
  unlockedPhaseIds,
  phaseProgress,
  taskStatuses,
  userCreatedAt,
  onTaskClick,
}: MobilePhaseAccordionProps) => {
  const [openPhaseId, setOpenPhaseId] = useState<string>('');
  const navigate = useNavigate();

  return (
    <Accordion
      type="single"
      collapsible
      value={openPhaseId}
      onValueChange={setOpenPhaseId}
      className="space-y-4"
    >
      {phases.map((phase) => {
        const isUnlocked = unlockedPhaseIds.includes(phase.id);
        const completedTasks = phaseProgress[phase.id] || 0;
        const totalTasks = phase.tasks.length;
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const isCompleted = completedTasks === totalTasks && totalTasks > 0;

        return (
          <AccordionItem
            key={phase.id}
            value={phase.id}
            className={cn(
              'border rounded-lg pointer-events-auto',
              !isUnlocked && 'opacity-80'
            )}
          >
            <AccordionTrigger className="px-4 hover:no-underline pointer-events-auto">
              <div className="flex items-start gap-3 text-left w-full">
                <div className="flex-shrink-0 pt-1">
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : isUnlocked ? (
                    <Unlock className="h-5 w-5 text-primary" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      Phase {phase.phase_order}
                    </Badge>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Trophy className="h-3 w-3" />
                      {phase.points} pts
                    </Badge>
                  </div>
                  <p className="font-medium">{phase.title}</p>
                  {isUnlocked && (
                    <Progress value={progress} className="h-2" />
                  )}
                  {!isUnlocked && (
                    <PhaseUnlockInfo
                      phaseId={phase.id}
                      unlockType={phase.unlock_type}
                      unlockCondition={phase.unlock_condition}
                      userCreatedAt={userCreatedAt}
                    />
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3 pt-3">
                {phase.description && (
                  <p className="text-sm text-muted-foreground">
                    {phase.description}
                  </p>
                )}
                {isUnlocked ? (
                  <div className="space-y-2">
                    {phase.tasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        status={taskStatuses[task.id] || 'pending'}
                        onClick={() => onTaskClick(task.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <PhaseUnlockInfo
                      phaseId={phase.id}
                      unlockType={phase.unlock_type}
                      unlockCondition={phase.unlock_condition}
                      userCreatedAt={userCreatedAt}
                    />
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => navigate('/home')}
                      className="w-full"
                    >
                      Go to Exams
                    </Button>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
