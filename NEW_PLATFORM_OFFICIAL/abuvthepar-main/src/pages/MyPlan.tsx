import { useState, useRef } from "react";
import { Rocket, ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import { MobileLogoHeader } from "@/components/MobileLogoHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useSprintData } from "@/hooks/useSprintData";
import { useSprintModuleLookup } from "@/hooks/useSprintModuleLookup";
import { ChecklistTask } from "@/components/sprint/ChecklistTask";
import { PhaseCompletionBanner } from "@/components/sprint/PhaseCompletionBanner";
import { SprintTaskDetailDrawer } from "@/components/sprint/SprintTaskDetailDrawer";
import { cn } from "@/lib/utils";
import type { SprintTask } from "@/hooks/useSprintData";

const MyPlan = () => {
  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>({});
  const [selectedTask, setSelectedTask] = useState<SprintTask | null>(null);
  const {
    phases,
    completions,
    isLoading,
    toggleCompletion,
    getPhaseTaskCount,
    getPhaseCompletedCount,
    getTasksForPhase,
    totalCompleted,
    totalTasks,
  } = useSprintData();
  const { getModuleLink } = useSprintModuleLookup();
  const phase1Ref = useRef<HTMLDivElement>(null);

  const togglePhase = (phaseId: string) => {
    setOpenPhases((prev) => ({ ...prev, [phaseId]: !(prev[phaseId] ?? true) }));
  };

  const overallProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  // Find the active phase (lowest incomplete)
  const activePhase = phases.find((p) => getPhaseCompletedCount(p.id) < getPhaseTaskCount(p.id));

  const scrollToPhase1 = () => {
    const firstPhase = phases[0];
    if (firstPhase) {
      setOpenPhases((prev) => ({ ...prev, [firstPhase.id]: true }));
    }
    setTimeout(() => {
      phase1Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <MobileLogoHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading sprint...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" data-tour="my-plan">
      <MobileLogoHeader />

      <ScrollArea className="flex-1">
        <div className="w-full max-w-[85%] mx-auto px-4 py-6 md:py-8">
          {/* Page title */}
          <div className="flex items-center gap-2 mb-5">
            <Rocket className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">My Roadmap</h1>
          </div>

          {/* Header card */}
          <div className="rounded-2xl bg-card border border-border p-6 mb-6 shadow-sm">
            <h2 className="text-lg md:text-xl font-bold text-foreground mb-1">
              My Action Plan
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Complete this sprint to open 5+ supplier accounts and be ready for your first orders
            </p>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>{totalCompleted} / {totalTasks} tasks completed</span>
                <span className="font-semibold text-foreground">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2.5" />
            </div>

            {/* Empty state */}
            {totalCompleted === 0 && (
              <div className="rounded-xl bg-muted/50 border border-border px-4 py-4 mb-4 text-center animate-fade-in">
                <p className="text-sm text-muted-foreground mb-2">Welcome to your action plan! Start with Day 1 below.</p>
                <button
                  onClick={scrollToPhase1}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Start Day 1 <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Phase pill badges */}
            <div className="flex flex-wrap gap-2">
              {phases.map((phase, idx) => {
                const completed = getPhaseCompletedCount(phase.id);
                const total = getPhaseTaskCount(phase.id);
                const isComplete = completed === total && total > 0;
                const isActive = activePhase?.id === phase.id && !isComplete;

                return (
                  <span
                    key={phase.id}
                    className={cn(
                      "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                      isComplete
                        ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/40"
                        : isActive
                          ? "bg-primary/10 text-primary border-primary/60 ring-1 ring-primary/40"
                          : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    Phase {idx + 1}: {completed}/{total}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Phase sections */}
          <div className="space-y-3">
            {phases.map((phase, idx) => {
              const phaseTasks = getTasksForPhase(phase.id);
              const isOpen = openPhases[phase.id] ?? true;
              const phaseCompleted = getPhaseCompletedCount(phase.id);
              const phaseTotal = phaseTasks.length;

              return (
                <Collapsible
                  key={phase.id}
                  open={isOpen}
                  onOpenChange={() => togglePhase(phase.id)}
                >
                  <div ref={idx === 0 ? phase1Ref : undefined} id={`phase-${idx + 1}`}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between rounded-xl px-4 py-3 bg-[hsl(220,25%,18%)] dark:bg-[hsl(220,20%,14%)] text-white hover:opacity-90 transition-opacity">
                        <div className="text-left flex-1">
                          <div className="text-xs font-bold tracking-wider uppercase">
                            PHASE {idx + 1}: {phase.title} (Days {phase.day_start}–{phase.day_end})
                          </div>
                          {phase.goal_text && (
                            <div className="text-[11px] font-normal opacity-70 mt-0.5 italic">
                              {phase.goal_text}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${phaseTotal > 0 ? (phaseCompleted / phaseTotal) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-semibold opacity-80">
                              {phaseCompleted} / {phaseTotal}
                            </span>
                          </div>
                        </div>
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0 ml-2 opacity-70" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 ml-2 opacity-70" />
                        )}
                      </button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="rounded-b-xl border border-t-0 border-border bg-card px-3 py-4 space-y-2">
                      {phaseTasks.map((task) => (
                        <ChecklistTask
                          key={task.id}
                          task={task}
                          status={completions.get(task.id)}
                          onToggle={toggleCompletion}
                          getModuleLink={getModuleLink}
                          onTaskClick={setSelectedTask}
                        />
                      ))}
                      {phaseCompleted === phaseTotal && phaseTotal > 0 && phase.completion_banner_text && (
                        <PhaseCompletionBanner message={phase.completion_banner_text} />
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      <SprintTaskDetailDrawer
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
        status={selectedTask ? completions.get(selectedTask.id) : undefined}
        onToggle={toggleCompletion}
        getModuleLink={getModuleLink}
      />
    </div>
  );
};

export default MyPlan;
