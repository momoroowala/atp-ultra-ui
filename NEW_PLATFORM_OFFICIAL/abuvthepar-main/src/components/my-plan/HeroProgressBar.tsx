import { useNavigate } from "react-router-dom";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface HeroProgressBarProps {
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
}

export const HeroProgressBar = ({ activeStage, overallPercent }: HeroProgressBarProps) => {
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!activeStage?.nextTaskId) return;
    if (activeStage.courseId) {
      navigate(`/courses/${activeStage.courseId}/modules/${activeStage.nextTaskId}`);
    } else {
      navigate("/courses");
    }
  };

  if (!activeStage) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary uppercase tracking-wide">My Roadmap</span>
        </div>
        <p className="text-muted-foreground text-sm">Complete your first module to unlock your execution tasks.</p>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Overall Journey</span>
            <span>{Math.round(overallPercent)}%</span>
          </div>
          <Progress value={overallPercent} className="h-2" />
        </div>
      </div>
    );
  }

  const stagePercent = activeStage.totalCount > 0
    ? Math.round((activeStage.completedCount / activeStage.totalCount) * 100)
    : 0;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 mb-6">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Current Stage</span>
          </div>
          <h2 className="text-lg font-bold text-foreground truncate">{activeStage.title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeStage.completedCount} / {activeStage.totalCount} tasks complete
          </p>
        </div>

        {activeStage.nextTaskId && (
          <Button
            size="sm"
            onClick={handleContinue}
            className="shrink-0 gap-1.5 rounded-xl"
          >
            Continue
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Stage progress */}
      <div className="mt-4">
        <Progress value={stagePercent} className="h-2" />
      </div>

      {/* Next task */}
      {activeStage.nextTaskTitle && (
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Up next: </span>
          {activeStage.nextTaskTitle}
        </p>
      )}

      {/* Overall */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-primary/10 pt-3">
        <span>Overall journey progress</span>
        <span className="font-semibold text-foreground">{Math.round(overallPercent)}%</span>
      </div>
    </div>
  );
};
