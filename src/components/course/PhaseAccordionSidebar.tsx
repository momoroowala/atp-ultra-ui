import { useState, useMemo } from 'react';
import { Check, ChevronUp, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  task_order: number;
  plan_group?: string | null;
  status?: 'completed' | 'in_progress' | 'not_started';
  isLocked?: boolean;
}

interface Phase {
  id: string;
  title: string;
  phase_order: number;
  tasks: Task[];
  isLocked: boolean;
  completedCount: number;
  totalCount: number;
}

type GroupItem = {
  type: 'headline';
  label: string;
  tasks: Task[];
} | {
  type: 'standalone';
  task: Task;
};

interface PhaseAccordionSidebarProps {
  phases: Phase[];
  selectedTaskId: string | null;
  expandedPhaseIds: Set<string>;
  onTaskSelect: (taskId: string, phaseId: string) => void;
  onPhaseToggle: (phaseId: string) => void;
}

function groupTasksForPhase(tasks: Task[]): GroupItem[] {
  const result: GroupItem[] = [];
  let currentGroup: string | null = null;
  let currentGroupTasks: Task[] = [];

  for (const task of tasks) {
    if (task.plan_group) {
      if (task.plan_group !== currentGroup) {
        if (currentGroup && currentGroupTasks.length > 0) {
          result.push({ type: 'headline', label: currentGroup, tasks: currentGroupTasks });
        }
        currentGroup = task.plan_group;
        currentGroupTasks = [task];
      } else {
        currentGroupTasks.push(task);
      }
    } else {
      if (currentGroup && currentGroupTasks.length > 0) {
        result.push({ type: 'headline', label: currentGroup, tasks: currentGroupTasks });
        currentGroup = null;
        currentGroupTasks = [];
      }
      result.push({ type: 'standalone', task });
    }
  }

  if (currentGroup && currentGroupTasks.length > 0) {
    result.push({ type: 'headline', label: currentGroup, tasks: currentGroupTasks });
  }

  return result;
}

export function PhaseAccordionSidebar({
  phases,
  selectedTaskId,
  expandedPhaseIds,
  onTaskSelect,
  onPhaseToggle,
}: PhaseAccordionSidebarProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const renderTaskRow = (task: Task, phaseId: string, indented: boolean) => {
    const isSelected = selectedTaskId === task.id;
    const isCompleted = task.status === 'completed';
    const isTaskLocked = task.isLocked === true;

    return (
      <button
        key={task.id}
        onClick={() => !isTaskLocked && onTaskSelect(task.id, phaseId)}
        disabled={isTaskLocked}
        className={cn(
          "w-full flex items-center gap-3 py-2.5 text-left transition-colors rounded-lg",
          indented ? "pl-8 pr-3" : "pl-3 pr-3",
          isTaskLocked
            ? "opacity-50 cursor-not-allowed"
            : isSelected
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted/50 text-foreground"
        )}
      >
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {isTaskLocked ? (
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          ) : isCompleted ? (
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center",
              isSelected ? "bg-primary-foreground/20" : "bg-primary/15"
            )}>
              <Check className={cn("h-3 w-3", isSelected ? "text-primary-foreground" : "text-primary")} />
            </div>
          ) : isSelected ? (
            <ChevronRight className="h-4 w-4 text-primary-foreground" />
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
          )}
        </div>
        <span className={cn("text-sm flex-1", isSelected ? "font-medium" : "font-normal")}>
          {task.title}
        </span>
      </button>
    );
  };

  const renderPhaseContent = (phase: Phase) => {
    const items = groupTasksForPhase(phase.tasks);

    return (
      <div className="space-y-0.5 py-1">
        {items.map((item, idx) => {
          if (item.type === 'standalone') {
            return renderTaskRow(item.task, phase.id, false);
          }

          const groupKey = `${phase.id}-${item.label}`;
          const isCollapsed = collapsedGroups.has(groupKey);
          const groupCompleted = item.tasks.every(t => t.status === 'completed');
          const hasSelectedTask = item.tasks.some(t => t.id === selectedTaskId);

          return (
            <div key={`${item.label}-${idx}`}>
              <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full flex items-center justify-between py-3 px-3 text-left transition-colors rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  {groupCompleted && (
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                  )}
                  <span className={cn(
                    "text-sm font-semibold text-foreground",
                    hasSelectedTask && "text-primary"
                  )}>
                    {item.label}
                  </span>
                </div>
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {item.tasks.map(task => renderTaskRow(task, phase.id, true))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {phases.map((phase) => {
        const isExpanded = expandedPhaseIds.has(phase.id);

        return (
          <div
            key={phase.id}
            className={cn(
              "rounded-lg border border-border overflow-hidden",
              phase.completedCount === phase.totalCount && phase.totalCount > 0
                ? "border-l-[3px] border-l-green-500"
                : phase.completedCount > 0 && !phase.isLocked
                  ? "border-l-[3px] border-l-primary"
                  : ""
            )}
          >
            <button
              onClick={() => onPhaseToggle(phase.id)}
              disabled={phase.isLocked}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 text-left transition-colors",
                phase.isLocked
                  ? "opacity-50 cursor-not-allowed bg-muted/30"
                  : "hover:bg-muted/50",
                isExpanded && "border-b border-border"
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm font-semibold text-foreground truncate">
                  {phase.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Mini progress bar */}
                {!phase.isLocked && phase.totalCount > 0 && (
                  <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        phase.completedCount === phase.totalCount ? "bg-green-500" : "bg-primary"
                      )}
                      style={{ width: `${(phase.completedCount / phase.totalCount) * 100}%` }}
                    />
                  </div>
                )}
                <span className="text-xs text-muted-foreground">
                  {phase.completedCount}/{phase.totalCount}
                </span>
                {phase.isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            </button>
            {isExpanded && !phase.isLocked && renderPhaseContent(phase)}
          </div>
        );
      })}
    </div>
  );
}
