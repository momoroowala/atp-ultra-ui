import { useCourses } from '@/hooks/useCourses';
import { useCourseTaskProgress } from '@/hooks/useCourseTaskProgress';

const useCourseProgress = (courseId: string | undefined) => {
  return useCourseTaskProgress(courseId);
};

export const OverallProgress = () => {
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

  const isLoading = progressResults.some(p => p.isLoading);

  if (accessibleCourses.length === 0 || isLoading) {
    return (
      <div className="flex items-center gap-4 py-4 px-4 bg-muted/30 rounded-lg">
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        <div className="flex-1 h-3 bg-muted animate-pulse rounded-full" />
        <div className="h-4 w-10 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  let totalCompletedPhases = 0;
  let totalPhases = 0;

  progressResults.forEach((progressResult) => {
    if (progressResult.data) {
      const completedPhases = progressResult.data.tasksByPhase?.filter(p => 
        p.totalTasks > 0 && p.completedTasks === p.totalTasks
      ).length || 0;
      const phases = progressResult.data.tasksByPhase?.filter(p => p.totalTasks > 0).length || 0;
      
      totalCompletedPhases += completedPhases;
      totalPhases += phases;
    }
  });

  const progressPercent = totalPhases > 0 ? Math.round((totalCompletedPhases / totalPhases) * 100) : 0;

  return (
    <div 
      id="progress-card" 
      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-4 px-4 bg-card border border-primary/30 rounded-lg shadow-[0_0_20px_rgba(85,189,138,0.1)]"
    >
      <div className="flex items-center gap-2 whitespace-nowrap">
        {progressPercent < 100 && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
        )}
        <span className="text-sm font-bold uppercase tracking-wider text-foreground">
          Module {totalCompletedPhases} of {totalPhases} Complete
        </span>
      </div>
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden relative">
          <div 
            className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
            style={{ 
              width: `${progressPercent}%`,
              background: 'radial-gradient(160.59% 161.46% at 50% 0%, hsl(var(--primary)) 0%, #6EDAA6 100%)',
            }}
          >
            {/* Striped pattern overlay */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'repeating-linear-gradient(288deg, rgb(0 0 0 / 0%), #0f172a00 6px, rgba(255, 255, 255, 0.15) 6px, rgba(255, 255, 255, 0.15) 9px)',
              }}
            />
            {/* Shimmer effect */}
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent" />
          </div>
        </div>
        <span className="text-sm font-bold text-foreground min-w-[3rem] text-right">{progressPercent}%</span>
      </div>
    </div>
  );
};
