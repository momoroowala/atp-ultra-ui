import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, Map } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useCourseTaskProgress } from '@/hooks/useCourseTaskProgress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export const ContinueCourseCard = () => {
  const navigate = useNavigate();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const accessibleCourses = courses?.filter((c) => c.hasAccess) || [];

  // Pick the first in-progress course
  const firstCourse = accessibleCourses[0];
  const { data: progress, isLoading: progressLoading } = useCourseTaskProgress(firstCourse?.id);

  const isLoading = coursesLoading || progressLoading;

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

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="px-3 py-2.5 bg-gradient-to-r from-primary/35 via-primary/15 to-transparent">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-4 space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!firstCourse) return null;

  return (
    <div data-tour="continue-course" className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-3 py-2.5 bg-gradient-to-r from-primary/35 via-primary/15 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/30">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Continue Your Course
          </h3>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Next lesson box */}
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Next Lesson
          </p>
          <p className="text-sm font-bold text-foreground leading-snug">
            {nextTaskTitle || 'All lessons complete! 🎉'}
          </p>
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                style={{
                  width: `${percent}%`,
                  background: 'linear-gradient(90deg, hsl(var(--primary-dark)) 0%, hsl(var(--primary)) 100%)',
                }}
              />
            </div>
            <span className="text-xs font-bold text-foreground min-w-[2.5rem] text-right">
              {percent}%
            </span>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            className="flex-1"
            onClick={() => {
              if (firstCourse.id && nextModuleId) {
                navigate(`/courses/${firstCourse.id}/modules/${nextModuleId}`);
              } else {
                navigate(`/courses/${firstCourse.id}`);
              }
            }}
          >
            Continue Learning
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => navigate('/my-plan')}
          >
            <Map className="mr-2 h-4 w-4" />
            View My Roadmap
          </Button>
        </div>
      </div>
    </div>
  );
};
