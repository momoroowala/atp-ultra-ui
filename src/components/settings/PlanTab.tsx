import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Plus, BookOpen } from 'lucide-react';
import { ConfirmationDialog } from '@/components/settings/customer-success/ConfirmationDialog';
import { PhaseCard } from './plan/PhaseCard';
import { PhaseDialog } from './plan/PhaseDialog';
import { CourseDialog } from './plan/CourseDialog';
import { useAdminCourses } from '@/hooks/useCourses';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

export const PlanTab = () => {
  const queryClient = useQueryClient();
  const [isPhaseDialogOpen, setIsPhaseDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<any>(null);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [deleteCourseConfirmOpen, setDeleteCourseConfirmOpen] = useState(false);
  const [pendingDeleteCourseId, setPendingDeleteCourseId] = useState<string | null>(null);
  const { courses, createCourse, updateCourse, deleteCourse } = useAdminCourses();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Fetch phases (without tasks to avoid timeout)
  const { data: phases, isLoading: phasesLoading, error: phasesError, refetch: refetchPhases } = useQuery({
    queryKey: ['phases', selectedCourseId],
    queryFn: async () => {
      if (!selectedCourseId) return [];

      const { data, error } = await supabase
        .from('phases')
        .select('*')
        .eq('course_id', selectedCourseId)
        .order('phase_order', { ascending: true });

      if (error) {
        console.error('Error fetching phases:', error);
        throw error;
      }

      // Sort to show active phases first, then inactive
      return data?.sort((a, b) => {
        if (a.is_active === b.is_active) return 0;
        return a.is_active ? -1 : 1;
      }) || [];
    },
    enabled: !!selectedCourseId,
  });

  // Fetch tasks separately after phases load
  const phaseIds = useMemo(() => (phases || []).map(p => p.id), [phases]);
  
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['phase-tasks-bulk', phaseIds],
    queryFn: async () => {
      if (!phaseIds || phaseIds.length === 0) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .in('phase_id', phaseIds)
        .order('task_order', { ascending: true });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }

      return data || [];
    },
    enabled: phaseIds.length > 0,
  });

  // Group tasks by phase_id
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

  const isLoading = phasesLoading || tasksLoading;
  const error = phasesError;
  const refetch = refetchPhases;

  // Auto-select first course when courses load
  useEffect(() => {
    if (!selectedCourseId && courses && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Show error toast if query fails (only once per error)
  useEffect(() => {
    if (error) {
      toast.error('Failed to load phases: ' + error.message);
    }
  }, [error]);

  const createPhase = useMutation({
    mutationFn: async (data: any) => {
      const course = courses?.find(c => c.id === selectedCourseId);
      const { error } = await supabase.from('phases').insert([{ 
        ...data, 
        course_id: selectedCourseId,
        visible_tier_ids: course?.visible_tier_ids || []
      }]);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['phases', selectedCourseId], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['phase-tasks-bulk'], refetchType: 'active' });
      toast.success('Phase created successfully');
      setIsPhaseDialogOpen(false);
      setEditingPhase(null);
    },
  });

  const updatePhase = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const course = courses?.find(c => c.id === selectedCourseId);
      const { error } = await supabase.from('phases').update({
        ...data,
        visible_tier_ids: course?.visible_tier_ids || []
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['phases', selectedCourseId], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['phase-tasks-bulk'], refetchType: 'active' });
      toast.success('Phase updated successfully');
      setIsPhaseDialogOpen(false);
      setEditingPhase(null);
    },
    onError: (error: any) => {
      toast.error('Failed to update phase: ' + error.message);
    },
  });

  const togglePhaseActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('phases').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['phases', selectedCourseId], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['phase-tasks-bulk'], refetchType: 'active' });
      toast.success(variables.is_active ? 'Phase activated successfully' : 'Phase deactivated successfully');
    },
  });

  const deletePhase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('phases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['phases', selectedCourseId], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['phase-tasks-bulk'], refetchType: 'active' });
      toast.success('Phase permanently deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete phase: ' + error.message);
    },
  });

  const reorderPhases = useMutation({
    mutationFn: async (updates: { id: string; phase_order: number }[]) => {
      const promises = updates.map(({ id, phase_order }) =>
        supabase.from('phases').update({ phase_order }).eq('id', id)
      );
      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['phases', selectedCourseId], refetchType: 'active' });
      await queryClient.invalidateQueries({ queryKey: ['phase-tasks-bulk'], refetchType: 'active' });
      toast.success('Phase order updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update phase order: ' + error.message);
    },
  });

  const handlePhaseDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !phases) return;

    const activeIsActive = phases.find(p => p.id === active.id)?.is_active;
    const overIsActive = phases.find(p => p.id === over.id)?.is_active;

    // Only allow reordering within the same active status group
    if (activeIsActive !== overIsActive) return;

    const relevantPhases = phases.filter(p => p.is_active === activeIsActive);
    const oldIndex = relevantPhases.findIndex(p => p.id === active.id);
    const newIndex = relevantPhases.findIndex(p => p.id === over.id);

    if (oldIndex === newIndex) return;

    const reorderedPhases = arrayMove(relevantPhases, oldIndex, newIndex);
    
    // Update phase_order for all affected phases
    const updates = reorderedPhases.map((phase, index) => ({
      id: phase.id,
      phase_order: index + 1,
    }));

    reorderPhases.mutate(updates);
  };

  const handleSaveCourse = async (courseData: any) => {
    if (editingCourse) {
      await updateCourse.mutateAsync({ id: editingCourse.id, updates: courseData });
    } else {
      await createCourse.mutateAsync(courseData);
    }
    setIsCourseDialogOpen(false);
    setEditingCourse(null);
  };

  const handleDeleteCourse = async (courseId: string) => {
    setPendingDeleteCourseId(courseId);
    setDeleteCourseConfirmOpen(true);
  };

  const confirmDeleteCourse = async () => {
    if (!pendingDeleteCourseId) return;
    setDeleteCourseConfirmOpen(false);
    await deleteCourse.mutateAsync(pendingDeleteCourseId);
    if (selectedCourseId === pendingDeleteCourseId) {
      setSelectedCourseId(null);
    }
  };

  const selectedCourse = courses?.find(c => c.id === selectedCourseId);

  return (
    <div className="space-y-6">
      {/* Courses Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Courses</h2>
          <Button onClick={() => { setEditingCourse(null); setIsCourseDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses?.map((course) => (
            <Card 
              key={course.id}
              className={`cursor-pointer transition-all ${selectedCourseId === course.id ? 'ring-2 ring-primary' : 'hover:shadow-lg'}`}
              onClick={() => setSelectedCourseId(course.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {course.description || 'No description'}
                    </CardDescription>
                  </div>
                  <BookOpen className="h-5 w-5 text-muted-foreground ml-2" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={course.is_active ? "default" : "outline"}>
                    {course.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Order: {course.course_order}</span>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEditingCourse(course);
                      setIsCourseDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDeleteCourse(course.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!courses || courses.length === 0) && (
          <p className="text-muted-foreground">No courses yet. Click 'Create Course' to create your first one.</p>
        )}
      </div>

      {/* Phases Section - Only show when course is selected */}
      {selectedCourse && (
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Phases in "{selectedCourse.title}"</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage the phases and modules for this course</p>
            </div>
            <PhaseDialog
              open={isPhaseDialogOpen}
              onOpenChange={setIsPhaseDialogOpen}
              phase={editingPhase}
              onSave={(data) => {
                if (editingPhase) {
                  updatePhase.mutate({ id: editingPhase.id, ...data });
                } else {
                  createPhase.mutate({ ...data, phase_order: (phases?.length || 0) + 1 });
                }
              }}
            >
              <Button onClick={() => { setEditingPhase(null); setIsPhaseDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Phase
              </Button>
            </PhaseDialog>
          </div>

          <DndContext
            id="plan-phases-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handlePhaseDragEnd}
          >
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-muted-foreground">Loading phases...</p>
              ) : error ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-destructive text-sm">Failed to load phases</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Retry
                  </Button>
                </div>
              ) : phases && phases.length > 0 ? (
                <>
                  {/* Active Phases */}
                  {phases.filter(p => p.is_active).length > 0 && (
                    <SortableContext
                      items={phases.filter(p => p.is_active).map(p => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {phases
                        .filter(p => p.is_active)
                        .map((phase) => (
                          <PhaseCard
                            key={phase.id}
                            phase={{ ...phase, tasks: tasksByPhase[phase.id] || [] }}
                            courseVisibleTierIds={selectedCourse?.visible_tier_ids}
                            onEdit={(p) => {
                              setEditingPhase(p);
                              setIsPhaseDialogOpen(true);
                            }}
                            onToggleActive={(id, is_active) => togglePhaseActive.mutate({ id, is_active })}
                            onDelete={(id) => deletePhase.mutate(id)}
                          />
                        ))}
                    </SortableContext>
                  )}
                  
                  {/* Inactive Phases */}
                  {phases.filter(p => !p.is_active).length > 0 && (
                    <SortableContext
                      items={phases.filter(p => !p.is_active).map(p => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {phases
                        .filter(p => !p.is_active)
                        .map((phase) => (
                          <PhaseCard
                            key={phase.id}
                            phase={{ ...phase, tasks: tasksByPhase[phase.id] || [] }}
                            courseVisibleTierIds={selectedCourse?.visible_tier_ids}
                            onEdit={(p) => {
                              setEditingPhase(p);
                              setIsPhaseDialogOpen(true);
                            }}
                            onToggleActive={(id, is_active) => togglePhaseActive.mutate({ id, is_active })}
                            onDelete={(id) => deletePhase.mutate(id)}
                          />
                        ))}
                    </SortableContext>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No phases yet. Click 'Add Phase' to create your first one.</p>
              )}
            </div>
          </DndContext>
        </div>
      )}

      <CourseDialog
        open={isCourseDialogOpen}
        onClose={() => {
          setIsCourseDialogOpen(false);
          setEditingCourse(null);
        }}
        onSave={handleSaveCourse}
        course={editingCourse}
      />

      <ConfirmationDialog
        open={deleteCourseConfirmOpen}
        onClose={() => setDeleteCourseConfirmOpen(false)}
        onConfirm={confirmDeleteCourse}
        title="Delete Course"
        description="Are you sure you want to delete this course? This will also delete all phases and modules within it."
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
};
