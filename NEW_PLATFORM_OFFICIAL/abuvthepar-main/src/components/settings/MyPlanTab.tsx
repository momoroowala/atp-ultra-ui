import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { PhaseCard } from './plan/PhaseCard';
import { useAdminCourses } from '@/hooks/useCourses';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList } from 'lucide-react';

export const MyPlanTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { courses } = useAdminCourses();

  // Auto-select first course
  useEffect(() => {
    if (!selectedCourseId && courses && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Fetch phases
  const { data: phases, isLoading: phasesLoading } = useQuery({
    queryKey: ['phases', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];
      const { data, error } = await supabase
        .from('phases')
        .select('*')
        .eq('course_id', selectedCourseId)
        .order('phase_order', { ascending: true });
      if (error) throw error;
      return data?.sort((a, b) => {
        if (a.is_active === b.is_active) return 0;
        return a.is_active ? -1 : 1;
      }) || [];
    },
    enabled: !!selectedCourseId,
  });

  const phaseIds = useMemo(() => (phases || []).map(p => p.id), [phases]);

  // Fetch only tasks where show_in_course = false (plan tasks)
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['phase-tasks-bulk-plan', phaseIds],
    queryFn: async () => {
      if (!phaseIds || phaseIds.length === 0) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .in('phase_id', phaseIds)
        .eq('show_in_course', false)
        .order('task_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: phaseIds.length > 0,
  });

  const tasksByPhase = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    (tasks || []).forEach(task => {
      if (!grouped[task.phase_id]) {
        grouped[task.phase_id] = [];
      }
      grouped[task.phase_id].push(task);
    });
    return grouped;
  }, [tasks]);

  const selectedCourse = courses?.find(c => c.id === selectedCourseId);

  return (
    <div className="space-y-6">
      {/* Course selector */}
      <div>
        <h2 className="text-2xl font-bold mb-4">My Roadmap — Task Management</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Manage actionable tasks that appear on the client's My Roadmap page. Tasks can be linked to course modules for "Watch Video" functionality.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses?.map((course) => (
            <Card 
              key={course.id}
              className={`cursor-pointer transition-all ${selectedCourseId === course.id ? 'ring-2 ring-primary' : 'hover:shadow-lg'}`}
              onClick={() => setSelectedCourseId(course.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <ClipboardList className="h-5 w-5 text-muted-foreground ml-2" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Phases with tasks */}
      {selectedCourse && phases && (
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Tasks in "{selectedCourse.title}"</h2>
              <p className="text-sm text-muted-foreground mt-1">
                These are actionable items that appear on the client's My Roadmap page
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {phasesLoading || tasksLoading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : phases.length > 0 ? (
              phases.filter(p => p.is_active).map((phase) => (
                <PhaseCard
                  key={phase.id}
                  phase={{ ...phase, tasks: tasksByPhase[phase.id] || [] }}
                  courseVisibleTierIds={selectedCourse?.visible_tier_ids}
                  onEdit={() => {}}
                  onToggleActive={() => {}}
                  onDelete={() => {}}
                  mode="task"
                />
              ))
            ) : (
              <p className="text-muted-foreground">No phases yet. Create phases in the Courses tab first.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
