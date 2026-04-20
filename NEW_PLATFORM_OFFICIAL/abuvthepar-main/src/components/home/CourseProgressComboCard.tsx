import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, Check, ChevronDown, ChevronUp, Circle, Clock } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useCourseTaskProgress } from '@/hooks/useCourseTaskProgress';
import { useSprintData } from '@/hooks/useSprintData';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const MAX_VISIBLE = 8;

export const CourseProgressComboCard = () => {
  const navigate = useNavigate();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const accessibleCourses = courses?.filter((c) => c.hasAccess) || [];
  const firstCourse = accessibleCourses[0];
  const { data: progress, isLoading: progressLoading } = useCourseTaskProgress(firstCourse?.id);
  const {
    phases, tasks, completions, isLoading: sprintLoading,
    getTasksForPhase, getPhaseCompletedCount, getPhaseTaskCount, cycleStatus,
  } = useSprintData();
  const [expanded, setExpanded] = useState(false);

  const isLoading = coursesLoading || progressLoading || sprintLoading;

  const { nextTaskTitle, nextModuleId, percent } = useMemo(() => {
    if (!progress?.tasksByPhase) return { nextTaskTitle: null, nextModuleId: null, percent: 0 };
    const total = progress.totalTasks || 0;
    const completed = progress.completedTasks || 0;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    for (const phaseData of progress.tasksByPhase) {
      if (phaseData.completedTasks < phaseData.totalTasks) {
        const incomplete = phaseData.tasks.filter((task) => {
          const response = progress.responses?.find((r) => r.task_id === task.id);
          return response?.status !== 'completed';
        });
        if (incomplete.length > 0) {
          return { nextTaskTitle: incomplete[0].title, nextModuleId: incomplete[0].id, percent: pct };
        }
      }
    }
    return { nextTaskTitle: null, nextModuleId: null, percent: pct };
  }, [progress]);

  const activePhase = useMemo(() => {
    if (!phases.length) return null;
    return phases.find(p => getPhaseCompletedCount(p.id) < getPhaseTaskCount(p.id)) || phases[phases.length - 1];
  }, [phases, completions, tasks]);

  const allPhasesComplete = useMemo(() => {
    if (!phases.length) return false;
    return phases.every(p => getPhaseCompletedCount(p.id) >= getPhaseTaskCount(p.id) && getPhaseTaskCount(p.id) > 0);
  }, [phases, completions, tasks]);

  if (isLoading) {
    return (
    <div className="rounded-xl border border-red-800/20 bg-card overflow-hidden shadow-[0_0_16px_rgba(153,27,27,0.06)]">
        <div className="px-4 py-3 bg-gradient-to-r from-red-800/25 via-red-700/10 to-transparent">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-4 space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!firstCourse) return null;

  const activeTasks = activePhase ? getTasksForPhase(activePhase.id) : [];
  const doneInPhase = activePhase ? getPhaseCompletedCount(activePhase.id) : 0;
  const totalInPhase = activePhase ? getPhaseTaskCount(activePhase.id) : 0;
  const visibleTasks = expanded ? activeTasks : activeTasks.slice(0, MAX_VISIBLE);
  const hasMore = activeTasks.length > MAX_VISIBLE;

  return (
    <div className="rounded-xl border border-red-800/20 bg-card overflow-hidden shadow-[0_0_16px_rgba(153,27,27,0.06)] hover:shadow-xl hover:shadow-red-800/5 transition-shadow duration-300">
      {/* Course Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[hsl(0,40%,32%)] via-[hsl(0,38%,38%)] to-[hsl(0,35%,44%)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-white/20">
              <BookOpen className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Course Progress
            </h3>
          </div>
          <span className="text-xs font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
            {percent}%
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 relative overflow-hidden bg-white/80"
            style={{ width: `${percent}%` }}
          >
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>
        </div>
      </div>

      {/* Next lesson + CTA */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Next Lesson</p>
            <p className="text-sm font-bold text-foreground truncate">
              {nextTaskTitle || 'All lessons complete! 🎉'}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 bg-gradient-to-r from-[hsl(0,40%,32%)] via-[hsl(0,38%,38%)] to-[hsl(0,35%,44%)] text-white hover:text-white hover:opacity-90 shadow-md border-none"
            onClick={() => {
              if (firstCourse.id && nextModuleId) {
                navigate(`/courses/${firstCourse.id}?taskId=${nextModuleId}`);
              } else {
                navigate(`/courses/${firstCourse.id}`);
              }
            }}
          >
            Continue
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* My Roadmap Phase Tasks — nested inner card */}
      {activePhase && activeTasks.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Progress</p>
          <div className="rounded-lg border border-red-800/20 bg-red-50/30 dark:bg-red-900/10 overflow-hidden">
            {/* Inner card header */}
            <div className="px-3 py-2.5 bg-red-100/60 dark:bg-red-900/20 border-b border-red-800/20 flex items-center justify-between">
              <p className="text-xs font-bold text-foreground">
                {activePhase.title}
              </p>
              <span className="text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-800/10 px-2 py-0.5 rounded-full">
                {totalInPhase > 0 ? Math.round((doneInPhase / totalInPhase) * 100) : 0}%
              </span>
            </div>

          <div className="p-2 space-y-0.5">
            {visibleTasks.map((task, i) => {
              const status = completions.get(task.id);
              const isCompleted = status === 'completed';
              const isPending = status === 'pending';

              return (
                <motion.button
                  key={task.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  onClick={() => cycleStatus(task.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-200 group',
                    isCompleted && 'bg-primary/5',
                    isPending && 'bg-orange-500/15 border-2 border-orange-500/60',
                    !isCompleted && !isPending && 'hover:bg-muted/50'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center h-5 w-5 rounded-full border-2 shrink-0 transition-all duration-300',
                      isCompleted && 'bg-red-800 border-red-800 text-white shadow-[0_0_8px_rgba(153,27,27,0.4)]',
                      isPending && 'bg-orange-500 border-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.5)]',
                      !isCompleted && !isPending && 'border-muted-foreground/30 bg-background'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-3 w-3" />
                    ) : isPending ? (
                      <Clock className="h-3 w-3 animate-pulse" />
                    ) : null}
                  </div>

                  <span
                    className={cn(
                      'text-xs font-medium truncate transition-colors',
                      isCompleted && 'text-red-800/50 dark:text-red-400/50 line-through',
                      isPending && 'text-orange-600 dark:text-orange-400 font-bold',
                      !isCompleted && !isPending && 'text-muted-foreground/70'
                    )}
                  >
                    {task.title}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 text-xs text-red-700 dark:text-red-400 hover:underline py-1.5 mt-1"
            >
              {expanded ? (
                <>Show less <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>Show {activeTasks.length - MAX_VISIBLE} more <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          )}

          {allPhasesComplete && (
             <div className="mt-2 rounded-lg bg-red-800/10 border border-red-800/20 p-2 text-center">
               <p className="text-xs font-semibold text-red-700 dark:text-red-400">🎉 All phases completed!</p>
            </div>
          )}
          </div>{/* close inner card */}
        </div>
      )}
    </div>
  );
};
