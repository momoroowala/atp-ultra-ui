import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Lock, Trophy, Clock, ClipboardCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDistanceToNow } from "date-fns";

interface Phase {
  id: string;
  title: string;
  phase_order: number;
  completedTasks: number;
  totalTasks: number;
  unlock_type?: string;
  unlock_condition?: any;
  isLocked?: boolean;
  unlockDate?: Date;
}

interface PhasesSidebarProps {
  phases: Phase[];
  selectedPhaseId: string | null;
  onSelectPhase: (phaseId: string) => void;
  quizRequirements?: Map<string, any>;
}

export const PhasesSidebar = ({ phases, selectedPhaseId, onSelectPhase, quizRequirements }: PhasesSidebarProps) => {
  const isMobile = useIsMobile();

  // Helper function to extract descriptive title without "Phase X:" prefix
  const getPhaseTitle = (title: string, phaseOrder: number) => {
    const prefix = `Phase ${phaseOrder}:`;
    const plainPhaseLabel = `Phase ${phaseOrder}`;

    // If title starts with "Phase X:", extract the part after the colon
    if (title.startsWith(prefix)) {
      return title.substring(prefix.length).trim();
    }

    // If title is EXACTLY "Phase X", return empty string (we already show badge)
    if (title.trim() === plainPhaseLabel) {
      return "";
    }

    // Otherwise return the title as-is
    return title;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-card border-r">
      <div className="p-2.5 border-b shrink-0">
        <h2 className="font-semibold text-base">Phases</h2>
        <p className="text-xs text-muted-foreground">Select a phase</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {phases.map((phase) => {
          const percentage = phase.totalTasks > 0 ? Math.round((phase.completedTasks / phase.totalTasks) * 100) : 0;
          const isSelected = phase.id === selectedPhaseId;
          const isCompleted = percentage === 100;
          const isLocked = phase.isLocked || false;

          return (
            <Card
              key={phase.id}
              role="button"
              tabIndex={0}
              className={`
                p-3 transition-all pointer-events-auto cursor-pointer hover:bg-background/60 hover:shadow-sm
                ${isSelected ? "bg-primary/10 border-primary/20 shadow-sm" : "border"}
                ${isLocked ? "opacity-80" : ""}
                ${isCompleted && !isSelected && !isLocked ? "border-success/20" : ""}
              `}
              onClick={() => onSelectPhase(phase.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPhase(phase.id);
                }
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    Phase {phase.phase_order}
                    {isLocked && <Lock className="h-3 w-3" />}
                    {isCompleted && !isLocked && <Trophy className="h-3 w-3 text-amber-500" />}
                  </span>
                  <span className="text-xs text-primary font-medium">{percentage}%</span>
                </div>

                {isMobile ? (
                  <p className="text-sm font-medium leading-tight line-clamp-2">
                    {getPhaseTitle(phase.title, phase.phase_order)}
                  </p>
                ) : (
                  <span className="text-sm font-medium line-clamp-2 leading-tight">
                    {getPhaseTitle(phase.title, phase.phase_order)}
                  </span>
                )}

                {isLocked && (
                  <div className="space-y-1">
                    {phase.unlockDate && (
                      <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(phase.unlockDate, { addSuffix: true })}
                      </p>
                    )}
                    {quizRequirements?.has(phase.id) && (
                      <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                        <ClipboardCheck className="h-3 w-3" />
                        Quiz Required
                      </p>
                    )}
                  </div>
                )}

                <Progress value={percentage} className="h-1.5" />
                <span className="text-xs text-muted-foreground">
                  {phase.completedTasks}/{phase.totalTasks} tasks
                </span>
              </div>
            </Card>
          );
        })}

        {/* Extra spacing equivalent to one phase card height */}
        <div className="h-48" />
      </div>
    </div>
  );
};
