import { Zap, ArrowRight, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PlanSummaryHeaderProps {
  activeStage: {
    title: string;
    completedCount: number;
    totalCount: number;
    nextTaskTitle?: string;
    nextTaskId?: string;
    courseId?: string;
    phaseId?: string;
  } | null;
  overallPercent: number;
  onContinue?: () => void;
}

export const PlanSummaryHeader = ({
  activeStage,
  overallPercent,
  onContinue,
}: PlanSummaryHeaderProps) => {
  if (!activeStage) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-6 shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold text-primary uppercase tracking-wider">My Roadmap</span>
        </div>
        <p className="text-muted-foreground text-sm">
          Complete your first module to unlock your execution tasks.
        </p>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Overall Journey</span>
            <span className="font-semibold text-foreground">{Math.round(overallPercent)}%</span>
          </div>
          <Progress value={overallPercent} className="h-2.5" />
        </div>
      </div>
    );
  }

  const stagePercent =
    activeStage.totalCount > 0
      ? Math.round((activeStage.completedCount / activeStage.totalCount) * 100)
      : 0;
  const remaining = activeStage.totalCount - activeStage.completedCount;

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/5 via-primary/8 to-primary/12 p-6 shadow-md">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Stage info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
              Current Stage
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground truncate">{activeStage.title}</h2>

          {/* Motivational counter */}
          <div className="flex items-center gap-2 mt-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {remaining > 0
                ? `${remaining} Task${remaining !== 1 ? "s" : ""} Left in This Phase`
                : "All tasks complete!"}
            </span>
          </div>
        </div>

        {/* Right: Continue button */}
        {activeStage.nextTaskId && onContinue && (
          <Button onClick={onContinue} className="shrink-0 gap-1.5 rounded-xl shadow-sm">
            Continue Setup
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Stage progress bar */}
      <div className="mt-5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted-foreground font-medium">Stage Progress</span>
          <span className="font-bold text-foreground">
            {activeStage.completedCount}/{activeStage.totalCount} tasks
          </span>
        </div>
        <Progress value={stagePercent} className="h-3" />
      </div>

      {/* Overall journey */}
      <div className="mt-4 pt-3 border-t border-primary/15">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Overall Journey</span>
          <span className="font-semibold text-foreground">{Math.round(overallPercent)}%</span>
        </div>
        <Progress value={overallPercent} className="h-1.5" />
      </div>
    </div>
  );
};
