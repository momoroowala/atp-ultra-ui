import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { BookOpen } from 'lucide-react';
import { useStatistics } from './StatisticsContext';

interface PhaseStats {
  id: string;
  title: string;
  avgCompletion: number;
  totalTasks: number;
}

interface CourseStats {
  id: string;
  title: string;
  avgCompletion: number;
  totalTasks: number;
  phases: PhaseStats[];
}

export const CourseCompletionStats = () => {
  const { users, courseStructure, taskResponses } = useStatistics();

  const courseStats = useMemo((): CourseStats[] => {
    if (!users.length || !courseStructure.length) return [];

    // Create task to phase mapping
    const taskToPhase = new Map<string, string>();
    const phaseToCourse = new Map<string, string>();
    
    courseStructure.forEach(course => {
      course.phases.forEach(phase => {
        phaseToCourse.set(phase.id, course.id);
        phase.tasks.forEach(task => {
          taskToPhase.set(task.id, phase.id);
        });
      });
    });

    // Count completions per user per phase
    const userPhaseCompletions = new Map<string, Map<string, number>>();
    
    taskResponses
      .filter(tr => tr.status === 'completed')
      .forEach(tr => {
        const phaseId = taskToPhase.get(tr.task_id);
        if (!phaseId) return;

        if (!userPhaseCompletions.has(tr.user_id)) {
          userPhaseCompletions.set(tr.user_id, new Map());
        }
        const userPhases = userPhaseCompletions.get(tr.user_id)!;
        userPhases.set(phaseId, (userPhases.get(phaseId) || 0) + 1);
      });

    // Calculate stats per course
    return courseStructure.map(course => {
      const courseTaskCount = course.phases.reduce(
        (acc, phase) => acc + phase.tasks.length, 0
      );

      // Calculate per-phase stats
      const phaseStats: PhaseStats[] = course.phases.map(phase => {
        const phaseTasks = phase.tasks.length;
        if (phaseTasks === 0) {
          return { id: phase.id, title: phase.title, avgCompletion: 0, totalTasks: 0 };
        }

        // Calculate average completion for this phase across all users
        let totalCompletion = 0;
        users.forEach(user => {
          const userPhases = userPhaseCompletions.get(user.id);
          const completed = userPhases?.get(phase.id) || 0;
          totalCompletion += (completed / phaseTasks) * 100;
        });

        return {
          id: phase.id,
          title: phase.title,
          avgCompletion: users.length > 0 ? Math.round(totalCompletion / users.length) : 0,
          totalTasks: phaseTasks,
        };
      });

      // Calculate course-level average
      let courseAvg = 0;
      if (courseTaskCount > 0) {
        users.forEach(user => {
          const userPhases = userPhaseCompletions.get(user.id);
          let userCourseCompleted = 0;
          course.phases.forEach(phase => {
            userCourseCompleted += userPhases?.get(phase.id) || 0;
          });
          courseAvg += (userCourseCompleted / courseTaskCount) * 100;
        });
        courseAvg = users.length > 0 ? Math.round(courseAvg / users.length) : 0;
      }

      return {
        id: course.id,
        title: course.title,
        avgCompletion: courseAvg,
        totalTasks: courseTaskCount,
        phases: phaseStats,
      };
    });
  }, [users, courseStructure, taskResponses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Course Completion Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        {courseStats.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No courses found</p>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {courseStats.map(course => (
              <AccordionItem key={course.id} value={course.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-medium">{course.title}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {course.totalTasks} tasks
                      </span>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={course.avgCompletion} className="h-2 w-20" />
                        <span className="text-sm font-medium w-10 text-right">
                          {course.avgCompletion}%
                        </span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 py-2">
                    {course.phases.map(phase => (
                      <div key={phase.id} className="flex items-center justify-between pl-4">
                        <span className="text-sm">{phase.title}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">
                            {phase.totalTasks} tasks
                          </span>
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Progress value={phase.avgCompletion} className="h-1.5 w-20" />
                            <span className="text-xs font-medium w-10 text-right">
                              {phase.avgCompletion}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};
