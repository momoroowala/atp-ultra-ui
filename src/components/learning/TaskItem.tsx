import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  Lock, 
  AlertCircle, 
  RefreshCw,
  Video,
  FileText,
  ClipboardList,
  FileUp
} from 'lucide-react';
import { Task } from '@/hooks/usePhasesWithTasks';
import { cn } from '@/lib/utils';

const taskTypeIcons = {
  video: Video,
  reading: FileText,
  form: ClipboardList,
  assignment: FileUp,
};

const statusConfig = {
  pending: { icon: Play, label: 'Not Started', color: 'text-muted-foreground' },
  in_progress: { icon: Clock, label: 'In Progress', color: 'text-blue-500' },
  pending_review: { icon: AlertCircle, label: 'Pending Review', color: 'text-amber-500' },
  changes_required: { icon: RefreshCw, label: 'Changes Required', color: 'text-orange-500' },
  completed: { icon: CheckCircle, label: 'Completed', color: 'text-green-500' },
  locked: { icon: Lock, label: 'Locked', color: 'text-muted-foreground' },
};

interface TaskItemProps {
  task: Task;
  status: string;
  isLocked?: boolean;
  onClick?: () => void;
}

export const TaskItem = ({ task, status, isLocked, onClick }: TaskItemProps) => {
  const displayStatus = isLocked ? 'locked' : status;
  const StatusIcon = statusConfig[displayStatus as keyof typeof statusConfig]?.icon || Play;
  const statusLabel = statusConfig[displayStatus as keyof typeof statusConfig]?.label || 'Not Started';
  const statusColor = statusConfig[displayStatus as keyof typeof statusConfig]?.color || 'text-muted-foreground';
  
  const TypeIcon = taskTypeIcons[task.task_type as keyof typeof taskTypeIcons] || FileText;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isLocked && 'opacity-50 cursor-not-allowed'
      )}
      onClick={!isLocked ? onClick : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg bg-primary/10', isLocked && 'bg-muted')}>
            <TypeIcon className="h-4 w-4 text-primary" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium leading-tight">{task.title}</h4>
              <StatusIcon className={cn('h-4 w-4 flex-shrink-0', statusColor)} />
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {statusLabel}
              </Badge>
              {task.duration_minutes && (
                <Badge variant="outline" className="text-xs">
                  {task.duration_minutes} min
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                +{task.points} pts
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
