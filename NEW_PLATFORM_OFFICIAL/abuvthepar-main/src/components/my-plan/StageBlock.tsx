import { useState } from "react";
import { CheckCircle2, Lock, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { PlanTaskRow } from "./PlanTaskRow";

export type StageStatus = "active" | "complete" | "locked";

interface StagePlanTask {
  id: string;
  title: string;
  phase_id: string;
  status?: string | null;
  plan_group?: string | null;
}

interface StageBlockProps {
  phaseIndex: number;
  title: string;
  status: StageStatus;
  tasks: StagePlanTask[];
  isExpanded: boolean;
  onToggle: () => void;
  courseId?: string;
  selectedTaskId?: string | null;
  onTaskSelect?: (taskId: string) => void;
}

interface TaskGroup {
  groupName: string;
  tasks: StagePlanTask[];
}

function groupTasksByPlanGroup(tasks: StagePlanTask[]): TaskGroup[] {
  const groups: TaskGroup[] = [];
  const seen = new Map<string, TaskGroup>();

  for (const task of tasks) {
    const key = task.plan_group || "";
    if (key && seen.has(key)) {
      seen.get(key)!.tasks.push(task);
    } else if (key) {
      const group: TaskGroup = { groupName: key, tasks: [task] };
      seen.set(key, group);
      groups.push(group);
    } else {
      // Ungrouped tasks get their own "group" with empty name
      groups.push({ groupName: "", tasks: [task] });
    }
  }
  return groups;
}

export const StageBlock = ({
  phaseIndex,
  title,
  status,
  tasks,
  isExpanded,
  onToggle,
  courseId,
  selectedTaskId,
  onTaskSelect,
}: StageBlockProps) => {
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isLocked = status === "locked";
  const isComplete = status === "complete";
  const isActive = status === "active";

  const taskGroups = groupTasksByPlanGroup(tasks);
  const hasGroups = taskGroups.some((g) => g.groupName !== "");

  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const handleClick = () => {
    if (isLocked) return;
    onToggle();
  };

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-200",
        isActive && isExpanded
          ? "border-primary/40 shadow-md bg-card"
          : isActive
          ? "border-primary/30 shadow-sm bg-card"
          : isComplete
          ? "border-primary/20 bg-card"
          : "border-border opacity-60 bg-card"
      )}
    >
      {/* Header row */}
      <button
        onClick={handleClick}
        disabled={isLocked}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3.5 text-left rounded-2xl transition-colors",
          isLocked ? "cursor-not-allowed" : "cursor-pointer hover:bg-muted/30"
        )}
      >
        {/* Status icon */}
        <div className="shrink-0">
          {isLocked ? (
            <Lock className="h-4 w-4 text-muted-foreground" />
          ) : isComplete ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" />
          )}
        </div>

        {/* Stage info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Stage {phaseIndex + 1}
            </span>
            {isComplete && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                Complete
              </span>
            )}
            {isLocked && (
              <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                Locked
              </span>
            )}
          </div>
          <p className={cn("text-sm font-semibold truncate mt-0.5", isLocked ? "text-muted-foreground" : "text-foreground")}>
            {title}
          </p>
        </div>

        {/* Task count + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground font-medium">
            {completedCount}/{totalCount}
          </span>
          {!isLocked && (
            isExpanded
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Progress bar (always visible when not locked) */}
      {!isLocked && (
        <div className="px-4 pb-2">
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      )}

      {/* Expanded task list */}
      {isExpanded && !isLocked && (
        <div className="pb-2 pt-1 border-t border-border/50 mt-1">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground px-4 py-2">No tasks in this stage.</p>
          ) : hasGroups ? (
            /* Grouped rendering */
            taskGroups.map((group) => {
              if (!group.groupName) {
                // Ungrouped tasks render flat
                return group.tasks.map((task) => (
                  <PlanTaskRow
                    key={task.id}
                    task={task}
                    isLocked={false}
                    courseId={courseId}
                    isSelected={selectedTaskId === task.id}
                    onTaskSelect={onTaskSelect}
                  />
                ));
              }

              const groupCompleted = group.tasks.filter((t) => t.status === "completed").length;
              const groupTotal = group.tasks.length;
              const isGroupExpanded = expandedGroups.has(group.groupName);

              return (
                <div key={group.groupName}>
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(group.groupName)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-muted/20 transition-colors"
                  >
                    {isGroupExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-xs font-bold text-foreground flex-1">
                      {group.groupName}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {groupCompleted}/{groupTotal}
                    </span>
                  </button>

                  {/* Group tasks */}
                  {isGroupExpanded &&
                    group.tasks.map((task) => (
                      <PlanTaskRow
                        key={task.id}
                        task={task}
                        isLocked={false}
                        courseId={courseId}
                        isSelected={selectedTaskId === task.id}
                        onTaskSelect={onTaskSelect}
                      />
                    ))}
                </div>
              );
            })
          ) : (
            /* Flat rendering (no groups) */
            tasks.map((task) => (
              <PlanTaskRow
                key={task.id}
                task={task}
                isLocked={false}
                courseId={courseId}
                isSelected={selectedTaskId === task.id}
                onTaskSelect={onTaskSelect}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
