import { useMemo } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCourseTaskProgress } from '@/hooks/useCourseTaskProgress';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
}

interface CourseProgressCardProps {
  course: Course;
  index?: number;
}

export const CourseProgressCard = ({ course, index = 0 }: CourseProgressCardProps) => {
  const navigate = useNavigate();
  const { data: progress, isLoading } = useCourseTaskProgress(course.id);

  const totalTasks = progress?.totalTasks || 0;
  const completedTasks = progress?.completedTasks || 0;
  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const isComplete = totalTasks > 0 && completedTasks === totalTasks;

  const nextTaskTitle = useMemo(() => {
    if (isComplete || !progress?.tasksByPhase) return null;
    for (const phaseData of progress.tasksByPhase) {
      if (phaseData.completedTasks < phaseData.totalTasks) {
        const incomplete = phaseData.tasks.filter(task => {
          const response = progress.responses?.find(r => r.task_id === task.id);
          return response?.status !== 'completed';
        });
        if (incomplete.length > 0) return incomplete[0].title;
      }
    }
    return null;
  }, [isComplete, progress?.tasksByPhase, progress?.responses]);

  if (isLoading) {
    return <div className="h-14 bg-muted/50 rounded-lg animate-pulse" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      className="flex items-center gap-3 p-3 rounded-lg border border-l-4 border-l-primary bg-card hover:bg-accent/50 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isComplete && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
          <span className="font-semibold text-sm text-foreground truncate">{course.title}</span>
        </div>
        {nextTaskTitle && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            Next: {nextTaskTitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 w-32">
        <Progress value={percent} className="h-2 flex-1" />
        <span className="text-xs font-bold text-muted-foreground w-8 text-right">{percent}%</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
    </motion.div>
  );
};
