import { CheckCircle2, Circle, Lock, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanTaskRowProps {
  task: {
    id: string;
    title: string;
    phase_id: string;
    status?: string | null;
  };
  isLocked: boolean;
  courseId?: string;
  isSelected?: boolean;
  onTaskSelect?: (taskId: string) => void;
}

export const PlanTaskRow = ({ task, isLocked, isSelected, onTaskSelect }: PlanTaskRowProps) => {
  const isCompleted = task.status === "completed";

  const handleClick = () => {
    if (isLocked) return;
    onTaskSelect?.(task.id);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl transition-all group",
        isLocked
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:bg-muted/40",
        isSelected && !isLocked && "bg-primary/10 border-l-4 border-primary shadow-sm",
        !isSelected && isCompleted && !isLocked && "bg-primary/5"
      )}
      onClick={handleClick}
    >
      {/* Status icon */}
      {isLocked ? (
        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
      ) : isCompleted ? (
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
      )}

      {/* Task title */}
      <span
        className={cn(
          "text-sm flex-1 leading-snug",
          isSelected && "font-semibold text-foreground",
          !isSelected && isCompleted && "text-muted-foreground line-through",
          !isSelected && !isCompleted && "text-foreground"
        )}
      >
        {task.title}
      </span>

      {/* Open arrow */}
      {!isLocked && (
        <ArrowUpRight className={cn(
          "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )} />
      )}
    </div>
  );
};
