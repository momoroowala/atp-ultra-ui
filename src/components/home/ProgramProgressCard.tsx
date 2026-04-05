import { useCourses } from '@/hooks/useCourses';
import { useCourseTaskProgress } from '@/hooks/useCourseTaskProgress';
import { CheckCircle2, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const useCourseProgress = (courseId: string | undefined) => {
  return useCourseTaskProgress(courseId);
};

const getMotivationalMessage = (percent: number) => {
  if (percent === 0) return "Let's get started! 🚀";
  if (percent <= 25) return "You've started strong! 💪";
  if (percent <= 50) return 'Making great progress! 🔥';
  if (percent <= 75) return "You're crushing it! ⚡";
  if (percent < 100) return 'Almost there! 🏆';
  return 'All modules complete! 🎉';
};

export const ProgramProgressCard = () => {
  const { data: courses } = useCourses();
  const accessibleCourses = courses?.filter((c) => c.hasAccess) || [];

  const course1Progress = useCourseProgress(accessibleCourses[0]?.id);
  const course2Progress = useCourseProgress(accessibleCourses[1]?.id);
  const course3Progress = useCourseProgress(accessibleCourses[2]?.id);
  const course4Progress = useCourseProgress(accessibleCourses[3]?.id);
  const course5Progress = useCourseProgress(accessibleCourses[4]?.id);

  const progressResults = [
    course1Progress,
    course2Progress,
    course3Progress,
    course4Progress,
    course5Progress,
  ].slice(0, accessibleCourses.length);

  const isLoading = progressResults.some((p) => p.isLoading);

  if (accessibleCourses.length === 0 || isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="px-3 py-2.5 bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full rounded-full" />
        </div>
      </div>
    );
  }

  let totalCompletedPhases = 0;
  let totalPhases = 0;

  progressResults.forEach((progressResult) => {
    if (progressResult.data) {
      const completedPhases =
        progressResult.data.tasksByPhase?.filter(
          (p) => p.totalTasks > 0 && p.completedTasks === p.totalTasks
        ).length || 0;
      const phases = progressResult.data.tasksByPhase?.filter((p) => p.totalTasks > 0).length || 0;

      totalCompletedPhases += completedPhases;
      totalPhases += phases;
    }
  });

  const progressPercent =
    totalPhases > 0 ? Math.round((totalCompletedPhases / totalPhases) * 100) : 0;

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-3 py-2.5 bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-blue-500/15">
            <TrendingUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Program Progress
          </h3>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Motivational text */}
        <p className="text-sm font-semibold text-foreground">
          {getMotivationalMessage(progressPercent)}
        </p>

        {/* Modules count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">
              {totalCompletedPhases} / {totalPhases} Modules Complete
            </span>
          </div>
          <span className="text-xs font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full">
            {progressPercent}%
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-3 rounded-full bg-muted overflow-hidden relative">
          <div
            className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
            style={{
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, rgb(37 99 235) 0%, rgb(59 130 246) 100%)',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(288deg, rgb(0 0 0 / 0%), #0f172a00 6px, rgba(255, 255, 255, 0.08) 6px, rgba(255, 255, 255, 0.08) 9px)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
