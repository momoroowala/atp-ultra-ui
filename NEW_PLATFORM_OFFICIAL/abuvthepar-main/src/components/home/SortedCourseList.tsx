import { useMemo } from 'react';
import { CourseProgressCard } from './CourseProgressCard';
import { useCourseTaskProgress } from '@/hooks/useCourseTaskProgress';

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
}

interface SortedCourseListProps {
  courses: Course[];
}

const useMultiCourseProgress = (courses: Course[]) => {
  const progress0 = useCourseTaskProgress(courses[0]?.id);
  const progress1 = useCourseTaskProgress(courses[1]?.id);
  const progress2 = useCourseTaskProgress(courses[2]?.id);
  const progress3 = useCourseTaskProgress(courses[3]?.id);
  const progress4 = useCourseTaskProgress(courses[4]?.id);
  const progress5 = useCourseTaskProgress(courses[5]?.id);
  const progress6 = useCourseTaskProgress(courses[6]?.id);
  const progress7 = useCourseTaskProgress(courses[7]?.id);
  const progress8 = useCourseTaskProgress(courses[8]?.id);
  const progress9 = useCourseTaskProgress(courses[9]?.id);

  const allProgress = [
    progress0, progress1, progress2, progress3, progress4,
    progress5, progress6, progress7, progress8, progress9,
  ].slice(0, courses.length);

  const isLoading = allProgress.some(p => p.isLoading);

  const progressMap = useMemo(() => {
    const map = new Map<string, number>();
    courses.forEach((course, idx) => {
      const progress = allProgress[idx]?.data;
      if (progress) {
        const total = progress.totalTasks || 0;
        const completed = progress.completedTasks || 0;
        map.set(course.id, total > 0 ? (completed / total) * 100 : 0);
      } else {
        map.set(course.id, 0);
      }
    });
    return map;
  }, [courses, allProgress]);

  return { progressMap, isLoading };
};

export const SortedCourseList = ({ courses }: SortedCourseListProps) => {
  const { progressMap, isLoading } = useMultiCourseProgress(courses);

  const sortedCourses = useMemo(() => {
    if (isLoading) return courses;
    return [...courses].sort((a, b) => {
      const aPercent = progressMap.get(a.id) || 0;
      const bPercent = progressMap.get(b.id) || 0;
      return bPercent - aPercent;
    });
  }, [courses, progressMap, isLoading]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {courses.map((course) => (
          <div key={course.id} className="h-14 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedCourses.map((course, index) => (
        <CourseProgressCard key={course.id} course={course} index={index} />
      ))}
    </div>
  );
};
