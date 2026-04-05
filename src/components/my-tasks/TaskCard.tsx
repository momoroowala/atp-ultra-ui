import { memo } from 'react';
import { Lock, Calendar, AlertCircle, CheckCircle2, PlayCircle, Trophy, FileText, Video, RotateCcw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getStatusLabel, TaskStatus } from '@/utils/taskStatusHelper';
import { DueDateInfo } from '@/utils/taskDueDateCalculator';
import { useNavigate } from 'react-router-dom';

interface TaskCardProps {
  task: any;
  status: TaskStatus;
  dueInfo: DueDateInfo;
  onStartTask: (taskId: string) => void;
  onClick: (taskId: string) => void;
  onRestartTask?: (taskId: string) => void;
}

export const TaskCard = memo(({ task, status, dueInfo, onStartTask, onClick, onRestartTask }: TaskCardProps) => {
  const navigate = useNavigate();
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isStarted = task.response?.started_at || status === 'in_progress';
  
  // Calculate video duration from sections if available
  const videoSections = task.sections?.filter((s: any) => s.section_type === 'video') || [];
  const totalVideoMinutes = videoSections.reduce((sum: number, section: any) => {
    const duration = section.content?.duration || 0;
    return sum + Math.ceil(duration / 60);
  }, 0);
  const hasVideos = videoSections.length > 0;

  const handleStartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartTask(task.id);
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/courses/${task.id}`);
  };


  // Determine card background based on status
  const getCardClassName = () => {
    if (isCompleted) {
      return 'bg-success/10 border-success/20';
    }
    if (isLocked) {
      return 'bg-muted/20 opacity-50 cursor-default';
    }
    return 'bg-muted/30';
  };

  // Get status badge variant
  const getStatusBadgeVariant = () => {
    if (isCompleted) return 'default';
    if (dueInfo?.isOverdue) return 'destructive';
    if (dueInfo?.isDueToday) return 'secondary';
    return 'outline';
  };

  return (
    <Card 
      id={`task-${task.id}`}
      className={getCardClassName()}
    >
      <div className="p-3 flex items-start gap-3">
        {/* Status Icon Circle */}
        <div className="shrink-0">
          {isCompleted ? (
            <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success-foreground" />
            </div>
          ) : isLocked ? (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center">
              <PlayCircle className="h-4 w-4 text-primary" />
            </div>
          )}
        </div>

        {/* Task Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Title Row with Badges */}
          <div className="space-y-1.5">
            <h3 className="font-semibold text-base leading-tight">{task.title}</h3>
            
            <div className="flex items-center gap-2 flex-wrap">
              {hasVideos && (
                <Badge variant="outline" className="gap-1">
                  <Video className="h-3 w-3" />
                  {totalVideoMinutes}min
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Trophy className="h-3 w-3" />
                {task.points} pts
              </Badge>
              <Badge variant={getStatusBadgeVariant()}>
                {getStatusLabel(status)}
              </Badge>
              {dueInfo?.isOverdue && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </Badge>
              )}
              {dueInfo?.isDueToday && !dueInfo.isOverdue && (
                <Badge className="gap-1 bg-yellow-500/90 text-yellow-950 hover:bg-yellow-500">
                  <Calendar className="h-3 w-3" />
                  Due Today
                </Badge>
              )}
            </div>
          </div>

          {/* Due Date */}
          {dueInfo?.dueDate && !isCompleted && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Due: {new Date(dueInfo.dueDate).toLocaleDateString()}</span>
            </div>
          )}

          {/* Task Description */}
          {(task.description || task.task_description) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <p className="line-clamp-1 truncate">{task.description || task.task_description}</p>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>{task.description || task.task_description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {isCompleted ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleViewClick}
                >
                  View/Edit
                </Button>
                {onRestartTask && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestartTask(task.id);
                    }}
                    className="gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restart
                  </Button>
                )}
              </>
            ) : isLocked ? (
              <Button size="sm" disabled variant="outline" className="gap-2">
                <Lock className="h-4 w-4" />
                Locked
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleStartClick}
              >
                {isStarted ? 'Continue Course' : 'Start Course'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});
