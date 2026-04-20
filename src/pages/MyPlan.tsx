import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronDown, ArrowRight, Blocks, Wrench, Mail, TrendingUp,
  Rocket, Package, Phone, Search, ShieldCheck, BarChart3, Play, Timer,
  Coffee, RotateCcw, Pause, ChevronRight, StickyNote, Clock,
  CalendarDays, Columns3, Focus, LayoutDashboard, FileText, Loader2,
} from "lucide-react";
import { MobileLogoHeader } from "@/components/MobileLogoHeader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useSprintData } from "@/hooks/useSprintData";
import { useSprintModuleLookup } from "@/hooks/useSprintModuleLookup";
import { useSprintTaskNotes } from "@/hooks/useSprintTaskNotes";
import { useMyNotes, type NoteWithTask } from "@/hooks/useMyNotes";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChecklistTask } from "@/components/sprint/ChecklistTask";
import { PhaseCompletionBanner } from "@/components/sprint/PhaseCompletionBanner";
import { SprintTaskDetailDrawer } from "@/components/sprint/SprintTaskDetailDrawer";
import { cn } from "@/lib/utils";
import type { SprintTask } from "@/hooks/useSprintData";

// ---------------------------------------------------------------------------
// Layout types
// ---------------------------------------------------------------------------
type LayoutMode = "default" | "focus" | "kanban" | "planner" | "notes";

const LAYOUT_STORAGE_KEY = "myplan_layout";

const LAYOUT_OPTIONS: { key: LayoutMode; label: string; icon: React.ElementType }[] = [
  { key: "default", label: "Default", icon: LayoutDashboard },
  { key: "focus", label: "Focus", icon: Focus },
  { key: "kanban", label: "Kanban", icon: Columns3 },
  { key: "planner", label: "Planner", icon: CalendarDays },
  { key: "notes", label: "Notes", icon: StickyNote },
];

// ---------------------------------------------------------------------------
// Phase theme system -- each phase gets a visual identity based on its title
// ---------------------------------------------------------------------------

interface PhaseTheme {
  accent: string;
  icon: React.ElementType;
  why: string;
  bgTint: string;
  borderAccent: string;
  nodeColor: string;
  taskMetaphor: string;
}

function getPhaseTheme(title: string, index: number): PhaseTheme {
  const t = title.toLowerCase();

  if (t.includes("foundation") || t.includes("setup") || t.includes("getting started") || t.includes("start")) {
    return { accent: "amber", icon: Blocks, why: "Every brick here holds up everything you build later.", bgTint: "from-amber-500/5 to-transparent", borderAccent: "border-amber-500/40", nodeColor: "bg-amber-500 border-amber-500", taskMetaphor: "brick" };
  }
  if (t.includes("sourcing") || t.includes("tool") || t.includes("research") || t.includes("finding")) {
    return { accent: "blue", icon: Wrench, why: "Each tool you learn here goes in your toolbox for life.", bgTint: "from-blue-500/5 to-transparent", borderAccent: "border-blue-500/40", nodeColor: "bg-blue-500 border-blue-500", taskMetaphor: "tool" };
  }
  if (t.includes("outreach") || t.includes("brand") || t.includes("email") || t.includes("contact")) {
    return { accent: "violet", icon: Mail, why: "Every email you send is a door you're knocking on.", bgTint: "from-violet-500/5 to-transparent", borderAccent: "border-violet-500/40", nodeColor: "bg-violet-500 border-violet-500", taskMetaphor: "door" };
  }
  if (t.includes("purchas") || t.includes("order") || t.includes("shipping") || t.includes("po") || t.includes("inventory")) {
    return { accent: "emerald", icon: Package, why: "This is where research turns into real revenue.", bgTint: "from-emerald-500/5 to-transparent", borderAccent: "border-emerald-500/40", nodeColor: "bg-emerald-500 border-emerald-500", taskMetaphor: "package" };
  }
  if (t.includes("growth") || t.includes("scale") || t.includes("advanced") || t.includes("optim") || t.includes("launch")) {
    return { accent: "rose", icon: Rocket, why: "You've built the foundation. Now you scale it.", bgTint: "from-rose-500/5 to-transparent", borderAccent: "border-rose-500/40", nodeColor: "bg-rose-500 border-rose-500", taskMetaphor: "rocket" };
  }
  if (t.includes("call") || t.includes("phone") || t.includes("follow") || t.includes("negoti")) {
    return { accent: "orange", icon: Phone, why: "Relationships close deals. Get on the phone.", bgTint: "from-orange-500/5 to-transparent", borderAccent: "border-orange-500/40", nodeColor: "bg-orange-500 border-orange-500", taskMetaphor: "call" };
  }
  if (t.includes("analy") || t.includes("data") || t.includes("review") || t.includes("number") || t.includes("metric")) {
    return { accent: "cyan", icon: BarChart3, why: "Numbers don't lie. Know yours inside and out.", bgTint: "from-cyan-500/5 to-transparent", borderAccent: "border-cyan-500/40", nodeColor: "bg-cyan-500 border-cyan-500", taskMetaphor: "chart" };
  }

  const fallbacks: PhaseTheme[] = [
    { accent: "amber", icon: Blocks, why: "Lay the groundwork here.", bgTint: "from-amber-500/5 to-transparent", borderAccent: "border-amber-500/40", nodeColor: "bg-amber-500 border-amber-500", taskMetaphor: "brick" },
    { accent: "blue", icon: Search, why: "Learn the tools of the trade.", bgTint: "from-blue-500/5 to-transparent", borderAccent: "border-blue-500/40", nodeColor: "bg-blue-500 border-blue-500", taskMetaphor: "tool" },
    { accent: "violet", icon: Mail, why: "Start making real connections.", bgTint: "from-violet-500/5 to-transparent", borderAccent: "border-violet-500/40", nodeColor: "bg-violet-500 border-violet-500", taskMetaphor: "door" },
    { accent: "emerald", icon: TrendingUp, why: "Put it all into action.", bgTint: "from-emerald-500/5 to-transparent", borderAccent: "border-emerald-500/40", nodeColor: "bg-emerald-500 border-emerald-500", taskMetaphor: "package" },
    { accent: "rose", icon: Rocket, why: "You're ready. Go big.", bgTint: "from-rose-500/5 to-transparent", borderAccent: "border-rose-500/40", nodeColor: "bg-rose-500 border-rose-500", taskMetaphor: "rocket" },
  ];
  return fallbacks[index % fallbacks.length];
}

// Small visual accent per task based on the phase metaphor
function TaskAccent({ metaphor, isCompleted }: { metaphor: string; index: number; isCompleted: boolean }) {
  if (!isCompleted) return null;
  const accents: Record<string, string> = {
    brick: "Laid", tool: "Equipped", door: "Knocked", package: "Shipped",
    rocket: "Launched", call: "Called", chart: "Tracked",
  };
  const label = accents[metaphor] || "Done";
  return (
    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 ml-auto shrink-0">
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Focus Timer -- shared by layouts A, B, C
// ---------------------------------------------------------------------------
function FocusTimer({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [pulseComplete, setPulseComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setPulseComplete(true);
            setTimeout(() => setPulseComplete(false), 3000);
            return 0;
          }
          if (mode === "focus") {
            setTotalFocusTime((t) => t + 1);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  const toggle = () => setIsRunning((r) => !r);
  const reset = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(mode === "focus" ? 25 * 60 : 5 * 60);
    setPulseComplete(false);
  };
  const switchMode = (m: "focus" | "break") => {
    setMode(m);
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimeLeft(m === "focus" ? 25 * 60 : 5 * 60);
    setPulseComplete(false);
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  const focusMinutes = Math.floor(totalFocusTime / 60);

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-all",
        pulseComplete ? "border-primary/60 bg-primary/10 animate-pulse" : "border-border bg-card"
      )}>
        <Timer className="h-4 w-4 text-primary shrink-0" />
        <span className="text-lg font-mono font-bold tabular-nums text-foreground">
          {minutes}:{seconds}
        </span>
        <div className="flex gap-1.5 ml-auto">
          <Button size="sm" variant={isRunning ? "outline" : "default"} className="h-7 px-2.5 text-xs" onClick={toggle}>
            {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={reset}>
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button size="sm" variant={mode === "focus" ? "secondary" : "ghost"} className="h-7 px-2 text-xs" onClick={() => switchMode("focus")}>25m</Button>
          <Button size="sm" variant={mode === "break" ? "secondary" : "ghost"} className="h-7 px-2 text-xs" onClick={() => switchMode("break")}>5m</Button>
        </div>
        {focusMinutes > 0 && (
          <span className="text-[10px] text-muted-foreground shrink-0">{focusMinutes}m focused</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-xl border p-5 transition-all",
      pulseComplete ? "border-primary/60 bg-primary/10 animate-pulse" : "border-border bg-card"
    )}>
      <div className="flex items-center gap-2 mb-4">
        <Timer className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-sm text-foreground">Focus Timer</h3>
        <span className={cn(
          "text-[10px] font-medium px-2 py-0.5 rounded-full ml-auto",
          mode === "focus" ? "bg-primary/15 text-primary" : "bg-emerald-500/15 text-emerald-600"
        )}>
          {mode === "focus" ? "Focus" : "Break"}
        </span>
      </div>

      <div className="text-center mb-4">
        <span className="text-5xl font-mono font-bold tabular-nums text-foreground">
          {minutes}:{seconds}
        </span>
        {pulseComplete && timeLeft === 0 && (
          <p className="text-sm text-primary font-medium mt-2 animate-fade-in">
            Time's up! Mark your task as complete?
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-center mb-3">
        <Button size="sm" onClick={toggle} className="gap-1.5">
          {isRunning ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Start</>}
        </Button>
        <Button size="sm" variant="outline" onClick={reset} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </Button>
      </div>

      <div className="flex gap-2 justify-center">
        <Button size="sm" variant={mode === "focus" ? "secondary" : "ghost"} onClick={() => switchMode("focus")} className="gap-1.5">
          <Timer className="h-3.5 w-3.5" /> 25 min
        </Button>
        <Button size="sm" variant={mode === "break" ? "secondary" : "ghost"} onClick={() => switchMode("break")} className="gap-1.5">
          <Coffee className="h-3.5 w-3.5" /> 5 min
        </Button>
      </div>

      {focusMinutes > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          {focusMinutes} min focused this session
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout A: Focus Mode
// ---------------------------------------------------------------------------
function LayoutFocus({
  phases, completions, tasks, activePhase, phaseThemes, toggleCompletion, getModuleLink, setSelectedTask,
  getPhaseCompletedCount, getPhaseTaskCount, getTasksForPhase,
}: LayoutProps) {
  const navigate = useNavigate();
  const [completedToday, setCompletedToday] = useState<string[]>([]);

  // Find the current (first incomplete) task in the active phase
  const activePhaseIndex = phases.findIndex((p) => p.id === activePhase?.id);
  const theme = activePhase ? phaseThemes[activePhaseIndex] : phaseThemes[0];
  const activeTasks = activePhase ? getTasksForPhase(activePhase.id) : [];
  const currentTask = activeTasks.find((t) => completions.get(t.id) !== "completed");
  const upNextTasks = activeTasks
    .filter((t) => t.id !== currentTask?.id && completions.get(t.id) !== "completed")
    .slice(0, 3);

  const { content: noteContent, updateContent: updateNote } = useSprintTaskNotes(currentTask?.id ?? null);

  const handleToggle = useCallback((taskId: string) => {
    const status = completions.get(taskId);
    if (status !== "completed") {
      setCompletedToday((prev) => prev.includes(taskId) ? prev : [...prev, taskId]);
    }
    toggleCompletion(taskId);
  }, [completions, toggleCompletion]);

  const phaseProgress = activePhase
    ? Math.round((getPhaseCompletedCount(activePhase.id) / Math.max(getPhaseTaskCount(activePhase.id), 1)) * 100)
    : 100;

  if (!currentTask) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">All tasks complete!</div>
        <p className="text-muted-foreground">You've finished every task in the active phase. Great work.</p>
      </div>
    );
  }

  const modules = currentTask.modules ?? [];
  const moduleLinks = modules
    .map((mod) => ({ mod, link: getModuleLink(mod.module_name) }))
    .filter((m): m is { mod: typeof modules[0]; link: { courseId: string; phaseId: string } } => m.link !== null);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main content -- left 70% */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Current task big card */}
        <Card className={cn("p-6 border-2", theme?.borderAccent)}>
          <div className="flex items-start gap-4">
            <button
              onClick={() => handleToggle(currentTask.id)}
              className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-muted-foreground/40 hover:border-primary shrink-0 mt-0.5 transition-colors"
            >
              {completions.get(currentTask.id) === "completed" && <Check className="h-4 w-4 text-primary" strokeWidth={3} />}
              {completions.get(currentTask.id) === "pending" && <Clock className="h-4 w-4 text-amber-500" strokeWidth={3} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Day {currentTask.day_number}
                </span>
                {activePhase && (
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", `bg-${theme.accent}-500/15 text-${theme.accent}-600`)}>
                    {activePhase.title}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground mb-3 cursor-pointer hover:text-primary transition-colors" onClick={() => setSelectedTask(currentTask)}>
                {currentTask.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                {moduleLinks.map((m, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => navigate(`/courses/${m.link.courseId}?phaseId=${m.link.phaseId}`)}
                  >
                    <Play className="h-3 w-3" />
                    {m.mod.module_name.replace(/^Module\s*/i, "M")}
                  </Button>
                ))}
                <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => setSelectedTask(currentTask)}>
                  Details <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Inline notes */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Quick Notes</span>
            </div>
            <Textarea
              placeholder="Jot down your thoughts on this task..."
              value={noteContent}
              onChange={(e) => updateNote(e.target.value)}
              className="min-h-[80px] text-sm bg-muted/30 border-border resize-y"
            />
          </div>
        </Card>

        {/* Pomodoro Timer */}
        <FocusTimer />

        {/* Up next preview */}
        {upNextTasks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Up Next</h3>
            {upNextTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-4 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
                onClick={() => setSelectedTask(task)}
              >
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/20 shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{task.title}</span>
                <span className="text-[10px] text-muted-foreground/50 ml-auto shrink-0">Day {task.day_number}</span>
              </div>
            ))}
          </div>
        )}

        {/* Phase progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{activePhase?.title ?? "Phase"} Progress</span>
            <span>{phaseProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${phaseProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Sidebar -- right 30% */}
      <div className="w-full lg:w-72 shrink-0 space-y-4">
        {/* Quick stats */}
        <Card className="p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Session Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{completedToday.length}</div>
              <div className="text-[10px] text-muted-foreground">Done today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {activeTasks.filter((t) => completions.get(t.id) === "completed").length}/{activeTasks.length}
              </div>
              <div className="text-[10px] text-muted-foreground">Phase tasks</div>
            </div>
          </div>
        </Card>

        {/* Today's completed */}
        {completedToday.length > 0 && (
          <Card className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Completed This Session</h3>
            <div className="space-y-1.5">
              {completedToday.map((taskId) => {
                const t = tasks.find((x) => x.id === taskId);
                if (!t) return null;
                return (
                  <div key={taskId} className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-500 shrink-0" />
                    <span className="text-xs text-muted-foreground line-through truncate">{t.title}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout B: Kanban Board (with drag-and-drop via @dnd-kit)
// ---------------------------------------------------------------------------
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragOverlay, useDroppable,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type KanbanColumn = 'todo' | 'pending' | 'done';
const COLUMN_STATUS_MAP: Record<KanbanColumn, 'not_started' | 'pending' | 'completed'> = {
  todo: 'not_started',
  pending: 'pending',
  done: 'completed',
};

function KanbanDropZone({ id, title, count, color, isEmpty, emptyMsg, children }: {
  id: string; title: string; count: number; color: string;
  isEmpty: boolean; emptyMsg: string; children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <h3 className={cn("text-xs font-bold uppercase tracking-wider", color)}>{title}</h3>
        <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{count}</span>
      </div>
      <div className={cn(
        "space-y-2 min-h-[120px] rounded-lg transition-colors p-1",
        isOver && "bg-primary/5 ring-1 ring-primary/20"
      )}>
        {isEmpty && !isOver && (
          <div className="rounded-lg border border-dashed border-border/50 bg-muted/10 p-4 text-center">
            <span className="text-xs text-muted-foreground/50">{emptyMsg}</span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function DraggableTaskCard({ task, theme, getModuleLink, setSelectedTask, navigate }: {
  task: SprintTask;
  theme: PhaseTheme;
  getModuleLink: LayoutProps['getModuleLink'];
  setSelectedTask: LayoutProps['setSelectedTask'];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeftColor: `hsl(var(--primary) / 0.5)`,
    opacity: isDragging ? 0.4 : 1,
  };

  const modules = task.modules ?? [];
  const moduleLink = modules.length > 0 ? getModuleLink(modules[0].module_name) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group touch-none",
        "border-l-[3px]",
        theme ? theme.borderAccent : "border-border"
      )}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-foreground leading-snug flex-1 min-w-0 line-clamp-2">
          {task.title}
        </span>
        <span className="text-[9px] font-bold text-muted-foreground bg-muted rounded-full px-1.5 py-0.5 shrink-0">
          D{task.day_number}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
        >
          Details
        </button>
        {moduleLink && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/courses/${moduleLink.courseId}?phaseId=${moduleLink.phaseId}`);
            }}
            className="ml-auto"
          >
            <Play className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>
      <div className="text-[9px] text-muted-foreground/40 mt-1">
        Drag to move between columns
      </div>
    </div>
  );
}

function LayoutKanban({
  phases, completions, activePhase, phaseThemes, setTaskStatus, getModuleLink, setSelectedTask,
  getPhaseCompletedCount, getPhaseTaskCount, getTasksForPhase,
}: LayoutProps) {
  const navigate = useNavigate();
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const phaseId = selectedPhaseId ?? activePhase?.id ?? phases[0]?.id;
  const phaseIdx = phases.findIndex((p) => p.id === phaseId);
  const theme = phaseThemes[phaseIdx] ?? phaseThemes[0];
  const phaseTasks = phaseId ? getTasksForPhase(phaseId) : [];

  const todoTasks = phaseTasks.filter((t) => !completions.has(t.id) || completions.get(t.id) === 'not_started');
  const pendingTasks = phaseTasks.filter((t) => completions.get(t.id) === "pending");
  const doneTasks = phaseTasks.filter((t) => completions.get(t.id) === "completed");

  const overallDone = phases.reduce((sum, p) => sum + getPhaseCompletedCount(p.id), 0);
  const overallTotal = phases.reduce((sum, p) => sum + getPhaseTaskCount(p.id), 0);
  const overallPct = overallTotal > 0 ? Math.round((overallDone / overallTotal) * 100) : 0;

  // Find which column a task lives in
  const getTaskColumn = (taskId: string): KanbanColumn => {
    const status = completions.get(taskId);
    if (status === 'completed') return 'done';
    if (status === 'pending') return 'pending';
    return 'todo';
  };

  // Find which column a droppable ID refers to
  const getDropColumn = (overId: string): KanbanColumn | null => {
    if (overId === 'col-todo') return 'todo';
    if (overId === 'col-pending') return 'pending';
    if (overId === 'col-done') return 'done';
    // If dropped on another task, find that task's column
    const overTask = phaseTasks.find(t => t.id === overId);
    if (overTask) return getTaskColumn(overTask.id);
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const targetColumn = getDropColumn(over.id as string);
    if (!targetColumn) return;

    const currentColumn = getTaskColumn(taskId);
    if (currentColumn === targetColumn) return;

    setTaskStatus(taskId, COLUMN_STATUS_MAP[targetColumn]);
  };

  const activeTask = activeTaskId ? phaseTasks.find(t => t.id === activeTaskId) : null;

  const columns = [
    { id: 'col-todo' as const, title: "To Do", tasks: todoTasks, emptyMsg: "Nothing to do!", color: "text-muted-foreground" },
    { id: 'col-pending' as const, title: "In Progress", tasks: pendingTasks, emptyMsg: "Nothing in progress", color: "text-amber-500" },
    { id: 'col-done' as const, title: "Done", tasks: doneTasks, emptyMsg: "Nothing completed yet", color: "text-green-500" },
  ];

  return (
    <div className="space-y-5">
      {/* Phase selector tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {phases.map((p, i) => {
          const isSelected = p.id === phaseId;
          const t = phaseThemes[i];
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPhaseId(p.id)}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                isSelected
                  ? `${t.borderAccent} bg-card shadow-sm text-foreground`
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              {p.title}
            </button>
          );
        })}
      </div>

      {/* Overall progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Overall Progress</span>
          <span>{overallPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {/* Kanban columns with drag-and-drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => (
            <KanbanDropZone
              key={col.id}
              id={col.id}
              title={col.title}
              count={col.tasks.length}
              color={col.color}
              isEmpty={col.tasks.length === 0}
              emptyMsg={col.emptyMsg}
            >
              <SortableContext items={col.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {col.tasks.map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    theme={theme}
                    getModuleLink={getModuleLink}
                    setSelectedTask={setSelectedTask}
                    navigate={navigate}
                  />
                ))}
              </SortableContext>
            </KanbanDropZone>
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div
              className="rounded-lg border bg-card p-3 shadow-xl border-l-[3px] opacity-90"
              style={{ borderLeftColor: `hsl(var(--primary) / 0.5)` }}
            >
              <span className="text-sm font-medium text-foreground">{activeTask.title}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Compact timer */}
      <FocusTimer compact />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout C: Daily Planner
// ---------------------------------------------------------------------------
function LayoutPlanner({
  phases, completions, tasks, activePhase, phaseThemes, toggleCompletion, getModuleLink, setSelectedTask,
  getPhaseCompletedCount, getPhaseTaskCount, getTasksForPhase,
}: LayoutProps) {
  const navigate = useNavigate();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [completedToday, setCompletedToday] = useState<string[]>([]);

  const activeTasks = activePhase ? getTasksForPhase(activePhase.id) : [];
  const incompleteTasks = activeTasks.filter((t) => completions.get(t.id) !== "completed");
  const completedTasks = activeTasks.filter((t) => completions.get(t.id) === "completed");

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) ?? null : null;
  const { content: noteContent, updateContent: updateNote } = useSprintTaskNotes(selectedTask?.id ?? null);

  // Work hours: 8 AM to 6 PM (10 hours)
  const hours = Array.from({ length: 10 }, (_, i) => i + 8);

  const handleToggle = useCallback((taskId: string) => {
    const status = completions.get(taskId);
    if (status !== "completed") {
      setCompletedToday((prev) => prev.includes(taskId) ? prev : [...prev, taskId]);
    }
    toggleCompletion(taskId);
  }, [completions, toggleCompletion]);

  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left side: timeline -- 65% */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">{todayStr}</h2>
        </div>

        {/* Vertical timeline */}
        <div className="relative">
          {hours.map((hour, hourIdx) => {
            // Assign an incomplete task to this hour slot (or null if we've run out)
            const task = hourIdx < incompleteTasks.length ? incompleteTasks[hourIdx] : null;
            // Also check if a completed task was at this slot index
            const completedTask = hourIdx >= incompleteTasks.length && (hourIdx - incompleteTasks.length) < completedTasks.length
              ? completedTasks[hourIdx - incompleteTasks.length]
              : null;
            const slotTask = task ?? completedTask;
            const isCompleted = slotTask ? completions.get(slotTask.id) === "completed" : false;
            const isPending = slotTask ? completions.get(slotTask.id) === "pending" : false;
            const isSelected = slotTask?.id === selectedTaskId;

            const hourLabel = hour <= 12 ? `${hour} AM` : `${hour - 12} PM`;
            if (hour === 12) {
              // Special case for noon
            }

            return (
              <div key={hour} className="flex gap-3 min-h-[64px]">
                {/* Time label */}
                <div className="w-14 shrink-0 text-right pt-1">
                  <span className="text-[11px] text-muted-foreground/60 font-mono">
                    {hour === 12 ? "12 PM" : hourLabel}
                  </span>
                </div>

                {/* Divider */}
                <div className="relative flex flex-col items-center">
                  <div className={cn(
                    "h-3 w-3 rounded-full border-2 shrink-0 z-10",
                    isCompleted ? "bg-green-500 border-green-500" :
                    isPending ? "bg-amber-500 border-amber-500" :
                    slotTask ? "bg-card border-primary/40" :
                    "bg-muted border-muted-foreground/20"
                  )} />
                  {hourIdx < hours.length - 1 && (
                    <div className="w-px flex-1 bg-border/50" />
                  )}
                </div>

                {/* Task block */}
                <div className="flex-1 min-w-0 pb-2">
                  {slotTask ? (
                    <div
                      className={cn(
                        "rounded-lg border px-3 py-2.5 cursor-pointer transition-all",
                        isCompleted
                          ? "border-green-500/30 bg-green-500/5"
                          : isPending
                            ? "border-amber-500/30 bg-amber-500/5"
                            : "border-border bg-card hover:bg-muted/30",
                        isSelected && "ring-2 ring-primary/30"
                      )}
                      onClick={() => setSelectedTaskId(slotTask.id)}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggle(slotTask.id); }}
                          className={cn(
                            "flex items-center justify-center h-5 w-5 rounded-full border-2 shrink-0 transition-colors",
                            isCompleted ? "bg-green-500 border-green-500 text-white" :
                            isPending ? "bg-amber-500 border-amber-500 text-white" :
                            "border-muted-foreground/40 hover:border-primary"
                          )}
                        >
                          {isCompleted && <Check className="h-3 w-3" strokeWidth={3} />}
                          {isPending && <Clock className="h-3 w-3" strokeWidth={3} />}
                        </button>
                        <span className={cn(
                          "text-sm font-medium flex-1 min-w-0 truncate",
                          isCompleted && "line-through text-muted-foreground"
                        )}>
                          {slotTask.title}
                        </span>
                        {slotTask.modules.length > 0 && (() => {
                          const link = getModuleLink(slotTask.modules[0].module_name);
                          return link ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/courses/${link.courseId}?phaseId=${link.phaseId}`);
                              }}
                              className="shrink-0"
                            >
                              <Play className="h-3.5 w-3.5 text-primary hover:text-primary/80" />
                            </button>
                          ) : null;
                        })()}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedTask(slotTask); }}
                          className="shrink-0"
                        >
                          <StickyNote className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border/30 bg-muted/5 px-3 py-2.5">
                      <span className="text-[11px] text-muted-foreground/30">Available</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right side -- 35% */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        {/* Focus Timer */}
        <FocusTimer />

        {/* Session Stats */}
        <Card className="p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Session Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{completedToday.length}</div>
              <div className="text-[10px] text-muted-foreground">Done today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {completedTasks.length}/{activeTasks.length}
              </div>
              <div className="text-[10px] text-muted-foreground">Phase done</div>
            </div>
          </div>
        </Card>

        {/* Quick Notes for selected task */}
        {selectedTask && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</h3>
            </div>
            <p className="text-xs text-foreground font-medium mb-2 truncate">{selectedTask.title}</p>
            <Textarea
              placeholder="Write notes for this task..."
              value={noteContent}
              onChange={(e) => updateNote(e.target.value)}
              className="min-h-[80px] text-sm bg-muted/30 border-border resize-y"
            />
          </Card>
        )}

        {/* Phase overview -- compact progress bars */}
        <Card className="p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">All Phases</h3>
          <div className="space-y-2.5">
            {phases.map((phase, idx) => {
              const done = getPhaseCompletedCount(phase.id);
              const total = getPhaseTaskCount(phase.id);
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const isActive = phase.id === activePhase?.id;
              return (
                <div key={phase.id}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={cn("text-[11px] truncate", isActive ? "font-bold text-foreground" : "text-muted-foreground")}>
                      {phase.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{done}/{total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        pct === 100 ? "bg-green-500" : isActive ? "bg-primary" : "bg-muted-foreground/30"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared layout props interface
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Layout D: Notes (aggregated from all tasks)
// ---------------------------------------------------------------------------
function NoteEditorInline({ note, isExpanded, onToggle }: { note: NoteWithTask; isExpanded: boolean; onToggle: () => void }) {
  const { content, updateContent, loading, saved } = useSprintTaskNotes(isExpanded ? note.sprint_task_id : null);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      className={cn(
        "w-full text-left rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm",
        isExpanded && "ring-1 ring-primary/20"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm text-foreground truncate">
            Day {note.day_number}: {note.task_title}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saved && <Check className="h-3.5 w-3.5 text-green-500" />}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {(() => { try { return `${Math.round((Date.now() - new Date(note.updated_at).getTime()) / 60000)}m ago`; } catch { return ''; } })()}
          </span>
        </div>
      </div>

      {!isExpanded && (
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{note.content}</p>
      )}

      {isExpanded && (
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => updateContent(e.target.value)}
              placeholder="Write your notes..."
              className="min-h-[120px] resize-y text-sm"
            />
          )}
        </div>
      )}
    </div>
  );
}

function LayoutNotes() {
  const { data: groups, isLoading } = useMyNotes();
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <StickyNote className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">My Notes</h2>
          <p className="text-sm text-muted-foreground">All your roadmap task notes in one place</p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (!groups || groups.length === 0) && (
        <div className="text-center py-16">
          <StickyNote className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">No notes yet</h3>
          <p className="text-sm text-muted-foreground">
            Start taking notes from your Roadmap tasks -- they'll appear here.
          </p>
        </div>
      )}

      {groups && groups.length > 0 && (
        <Accordion type="multiple" defaultValue={groups.map(g => g.phase_id)} className="space-y-3">
          {groups.map((group) => (
            <AccordionItem key={group.phase_id} value={group.phase_id} className="border rounded-xl bg-card/50 px-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{group.phase_title}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {group.notes.length} {group.notes.length === 1 ? 'note' : 'notes'}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-2">
                  {group.notes.map((note) => (
                    <NoteEditorInline
                      key={note.id}
                      note={note}
                      isExpanded={expandedNote === note.id}
                      onToggle={() => setExpandedNote(prev => prev === note.id ? null : note.id)}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

interface LayoutProps {
  phases: ReturnType<typeof useSprintData>["phases"];
  tasks: ReturnType<typeof useSprintData>["tasks"];
  completions: ReturnType<typeof useSprintData>["completions"];
  activePhase: ReturnType<typeof useSprintData>["phases"][number] | undefined;
  phaseThemes: PhaseTheme[];
  toggleCompletion: (taskId: string) => void;
  setTaskStatus: (taskId: string, status: 'pending' | 'completed' | 'not_started') => void;
  getModuleLink: ReturnType<typeof useSprintModuleLookup>["getModuleLink"];
  setSelectedTask: (task: SprintTask) => void;
  getPhaseCompletedCount: (phaseId: string) => number;
  getPhaseTaskCount: (phaseId: string) => number;
  getTasksForPhase: (phaseId: string) => SprintTask[];
}

// ---------------------------------------------------------------------------
// Default Layout (original phase cards)
// ---------------------------------------------------------------------------
function LayoutDefault({
  phases, completions, activePhase, phaseThemes, toggleCompletion, getModuleLink, setSelectedTask,
  getPhaseCompletedCount, getPhaseTaskCount, getTasksForPhase, totalCompleted,
  expandedPhases, setExpandedPhases, isPhaseExpanded, togglePhase, phase1Ref, scrollToPhase1, totalTasks,
}: LayoutProps & {
  totalCompleted: number;
  totalTasks: number;
  expandedPhases: Record<string, boolean>;
  setExpandedPhases: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isPhaseExpanded: (phaseId: string) => boolean;
  togglePhase: (phaseId: string) => void;
  phase1Ref: React.RefObject<HTMLDivElement | null>;
  scrollToPhase1: () => void;
}) {
  return (
    <div className="space-y-4">
      {phases.map((phase, idx) => {
        const phaseTasks = getTasksForPhase(phase.id);
        const phaseCompleted = getPhaseCompletedCount(phase.id);
        const phaseTotal = getPhaseTaskCount(phase.id);
        const isComplete = phaseCompleted === phaseTotal && phaseTotal > 0;
        const isActive = activePhase?.id === phase.id;
        const expanded = isPhaseExpanded(phase.id);
        const theme = phaseThemes[idx];
        const ThemeIcon = theme.icon;
        const phaseProgress = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;

        return (
          <div
            key={phase.id}
            ref={idx === 0 ? phase1Ref : undefined}
            id={`phase-${idx + 1}`}
            className={cn(
              "rounded-xl border overflow-hidden transition-all",
              isActive
                ? `${theme.borderAccent} shadow-md`
                : isComplete
                ? "border-green-500/20 opacity-80"
                : "border-border/40 opacity-60"
            )}
          >
            {isActive && (
              <div className={`h-1 bg-gradient-to-r ${theme.bgTint.replace('to-transparent', `to-${theme.accent}-500/20`)}`}
                style={{ background: `linear-gradient(90deg, var(--${theme.accent}-color, hsl(var(--primary))) 0%, transparent 100%)` }}
              />
            )}

            <button
              onClick={() => togglePhase(phase.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors",
                isActive ? `bg-gradient-to-r ${theme.bgTint}` : "bg-card/50 hover:bg-muted/30"
              )}
            >
              <div className={cn(
                "flex items-center justify-center h-9 w-9 rounded-lg shrink-0",
                isComplete
                  ? "bg-green-500/15 text-green-600"
                  : isActive
                  ? `bg-${theme.accent}-500/15 text-${theme.accent}-600 dark:text-${theme.accent}-400`
                  : "bg-muted/50 text-muted-foreground"
              )} style={isActive && !isComplete ? { backgroundColor: `hsl(var(--primary) / 0.12)` } : undefined}>
                {isComplete ? (
                  <Check className="h-4.5 w-4.5" />
                ) : (
                  <ThemeIcon className="h-4.5 w-4.5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={cn(
                    "font-semibold text-sm",
                    isComplete ? "text-green-700 dark:text-green-400 line-through decoration-green-500/30" : "text-foreground"
                  )}>
                    {phase.title}
                  </h3>
                  <span className="text-[10px] text-muted-foreground">
                    {phaseCompleted}/{phaseTotal}
                  </span>
                </div>

                {isActive && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                    {theme.why}
                  </p>
                )}

                {!isActive && phase.goal_text && (
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">
                    {phase.goal_text}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:block w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isComplete ? "bg-green-500" : "bg-primary"
                    )}
                    style={{ width: `${phaseProgress}%` }}
                  />
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    !expanded && "-rotate-90"
                  )}
                />
              </div>
            </button>

            {expanded && (
              <div className={cn(
                "px-4 pb-4 pt-1",
                isActive ? `bg-gradient-to-b ${theme.bgTint}` : "bg-card/30"
              )}>
                <div className="space-y-1">
                  {phaseTasks.map((task, taskIdx) => (
                    <div key={task.id} className="flex items-center gap-1">
                      <div className="flex-1 min-w-0">
                        <ChecklistTask
                          task={task}
                          status={completions.get(task.id)}
                          onToggle={toggleCompletion}
                          getModuleLink={getModuleLink}
                          onTaskClick={setSelectedTask}
                        />
                      </div>
                      <TaskAccent
                        metaphor={theme.taskMetaphor}
                        index={taskIdx}
                        isCompleted={completions.get(task.id) === "completed"}
                      />
                    </div>
                  ))}
                </div>

                {isComplete && phase.completion_banner_text && (
                  <PhaseCompletionBanner message={phase.completion_banner_text} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const MyPlan = () => {
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
  const [selectedTask, setSelectedTask] = useState<SprintTask | null>(null);
  const [layout, setLayout] = useState<LayoutMode>(() => {
    try {
      return (localStorage.getItem(LAYOUT_STORAGE_KEY) as LayoutMode) || "default";
    } catch {
      return "default";
    }
  });

  const {
    phases,
    tasks,
    completions,
    isLoading,
    toggleCompletion,
    setTaskStatus,
    getPhaseTaskCount,
    getPhaseCompletedCount,
    getTasksForPhase,
    totalCompleted,
    totalTasks,
  } = useSprintData();
  const { getModuleLink } = useSprintModuleLookup();
  const phase1Ref = useRef<HTMLDivElement>(null);

  const overallProgress = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  const activePhase = phases.find((p) => getPhaseCompletedCount(p.id) < getPhaseTaskCount(p.id));

  const currentWeek = activePhase
    ? Math.max(1, Math.ceil(activePhase.day_start / 7))
    : phases.length > 0
      ? Math.ceil(phases[phases.length - 1].day_end / 7)
      : 1;
  const totalWeeks = phases.length > 0 ? Math.ceil(phases[phases.length - 1].day_end / 7) : 4;

  const phaseThemes = useMemo(() => {
    return phases.map((p, i) => getPhaseTheme(p.title, i));
  }, [phases]);

  const isPhaseExpanded = (phaseId: string) => {
    if (phaseId in expandedPhases) return expandedPhases[phaseId];
    return activePhase?.id === phaseId;
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !isPhaseExpanded(phaseId),
    }));
  };

  const scrollToPhase1 = () => {
    const firstPhase = phases[0];
    if (firstPhase) {
      setExpandedPhases((prev) => ({ ...prev, [firstPhase.id]: true }));
    }
    setTimeout(() => {
      phase1Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleLayoutChange = (l: LayoutMode) => {
    setLayout(l);
    try { localStorage.setItem(LAYOUT_STORAGE_KEY, l); } catch {}
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <MobileLogoHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">Loading your plan...</div>
        </div>
      </div>
    );
  }

  // Shared layout props
  const layoutProps: LayoutProps = {
    phases, tasks, completions, activePhase, phaseThemes, toggleCompletion, setTaskStatus,
    getModuleLink, setSelectedTask, getPhaseCompletedCount, getPhaseTaskCount, getTasksForPhase,
  };

  return (
    <div className="flex flex-col h-full" data-tour="my-plan">
      <MobileLogoHeader />

      <ScrollArea className="flex-1">
        <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-8">
          {/* Hero Summary */}
          <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Your Action Plan</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Week {currentWeek} of {totalWeeks} -- {totalCompleted} of {totalTasks} tasks complete
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-primary">{overallProgress}%</span>
              </div>
            </div>
            <div className="mt-3 h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-700"
                style={{ width: `${overallProgress}%` }}
              />
            </div>

            {totalCompleted === 0 && layout === "default" && (
              <div className="rounded-xl bg-muted/50 border border-border px-4 py-4 mt-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">Your plan is ready. Start with Day 1 below.</p>
                <button
                  onClick={scrollToPhase1}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Start Day 1 <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Layout Switcher */}
          <div className="flex items-center gap-1 mb-6 p-1 rounded-xl bg-muted/50 border border-border/50 w-fit">
            {LAYOUT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = layout === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => handleLayoutChange(opt.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    isActive
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Layout Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={layout}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {layout === "default" && (
                <LayoutDefault
                  {...layoutProps}
                  totalCompleted={totalCompleted}
                  totalTasks={totalTasks}
                  expandedPhases={expandedPhases}
                  setExpandedPhases={setExpandedPhases}
                  isPhaseExpanded={isPhaseExpanded}
                  togglePhase={togglePhase}
                  phase1Ref={phase1Ref}
                  scrollToPhase1={scrollToPhase1}
                />
              )}
              {layout === "focus" && <LayoutFocus {...layoutProps} />}
              {layout === "kanban" && <LayoutKanban {...layoutProps} />}
              {layout === "planner" && <LayoutPlanner {...layoutProps} />}
              {layout === "notes" && <LayoutNotes />}
            </motion.div>
          </AnimatePresence>
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
