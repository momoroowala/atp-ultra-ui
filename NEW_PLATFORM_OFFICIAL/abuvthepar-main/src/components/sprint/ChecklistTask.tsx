import { useNavigate } from 'react-router-dom';
import { Play, Check, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import type { SprintTask, TaskStatus } from '@/hooks/useSprintData';

interface ChecklistTaskProps {
  task: SprintTask;
  status?: TaskStatus;
  onToggle: (taskId: string) => void;
  getModuleLink: (moduleRef: string) => { courseId: string; phaseId: string } | null;
  onTaskClick?: (task: SprintTask) => void;
}


export const ChecklistTask = ({ task, status, onToggle, getModuleLink, onTaskClick }: ChecklistTaskProps) => {
  const navigate = useNavigate();
  const isCompleted = status === 'completed';
  const isPending = status === 'pending';

  const modules = task.modules ?? [];

  const moduleLinks = modules
    .map((mod) => ({ mod, link: getModuleLink(mod.module_name) }))
    .filter((m): m is { mod: typeof modules[0]; link: { courseId: string; phaseId: string } } => m.link !== null);

  const uniqueLinks = moduleLinks
    .filter((m, i, arr) => arr.findIndex((x) => x.link.courseId === m.link.courseId && x.link.phaseId === m.link.phaseId) === i)
    .sort((a, b) => a.mod.module_name.localeCompare(b.mod.module_name, undefined, { numeric: true }));

  const hasDetail = !!(task.success_metrics || task.common_mistakes || (task.templates && (task.templates as any[]).length > 0));

  return (
    <div
      className={cn(
        'flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-3 rounded-lg border px-4 py-3 transition-all',
        task.is_final
          ? 'bg-green-500/10 border-green-500/30'
          : task.is_checkpoint
            ? 'bg-amber-500/10 border-amber-500/30'
            : isPending
              ? 'bg-amber-500/5 border-amber-500/20'
              : 'bg-card border-border',
        isCompleted ? 'opacity-60' : 'hover:bg-muted/50',
        onTaskClick && 'cursor-pointer'
      )}
      onClick={() => onTaskClick?.(task)}
    >
      {/* Custom circle checkbox — cycles: empty → pending (amber) → completed (green) → empty */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className={cn(
          'flex items-center justify-center h-5 w-5 rounded-full border-2 shrink-0 transition-colors',
          isCompleted
            ? 'bg-green-500 border-green-500 text-white'
            : isPending
              ? 'bg-amber-500 border-amber-500 text-white'
              : 'border-muted-foreground/40 hover:border-primary'
        )}
      >
        {isCompleted && <Check className="h-3 w-3" strokeWidth={3} />}
        {isPending && <Clock className="h-3 w-3" strokeWidth={3} />}
      </button>


      {task.is_checkpoint && (
        <span className="inline-flex items-center rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
          🏁 Checkpoint
        </span>
      )}

      {task.is_final && (
        <span className="inline-flex items-center rounded-full bg-green-500/20 border border-green-500/40 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:text-green-400 shrink-0">
          🎉 Final Day
        </span>
      )}

      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn(
              'flex-1 min-w-0 text-sm font-semibold line-clamp-2 md:truncate',
              isCompleted
                ? 'line-through text-muted-foreground'
                : isPending
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-foreground'
            )}>
              {task.title}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {task.title}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className={cn(
        "flex gap-1.5 shrink-0 w-full md:w-auto ml-7 md:ml-0 flex-wrap md:flex-nowrap",
        uniqueLinks.length > 2 ? "md:flex-col md:items-end" : "items-center"
      )}>
        {uniqueLinks.map((m, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/courses/${m.link.courseId}?phaseId=${m.link.phaseId}`);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 md:px-2.5 md:py-1 text-[11px] md:text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Play className="h-3 w-3 shrink-0" />
            <span className="truncate">
              <span className="md:hidden">{m.mod.module_name.replace(/^Module\s*/i, 'M').replace(/\s*[-—].*$/, '')}</span>
              <span className="hidden md:inline">{m.mod.module_name.replace(/^Module\s*/i, 'M')}</span>
            </span>
          </button>
        ))}
      </div>

      {hasDetail && onTaskClick && (
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
    </div>
  );
};
