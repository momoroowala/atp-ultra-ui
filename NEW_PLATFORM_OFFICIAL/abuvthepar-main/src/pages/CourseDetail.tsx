import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCourseDetail } from "@/hooks/useCourseDetail";
import { useCourseQuizRequirements } from "@/hooks/useCourseQuizRequirements";
import { useQuizStatus } from "@/hooks/useQuizStatus";
import { useInlineTaskDetail } from "@/hooks/useInlineTaskDetail";
import { useAuth } from "@/hooks/useAuth";
import { useUserCourseAccess } from "@/hooks/useUserCourseAccess";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Lock, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { tryGraduateOnboarding } from "@/utils/onboardingGraduation";
import { PhaseAccordionSidebar } from "@/components/course/PhaseAccordionSidebar";
import { InlineLessonContent } from "@/components/course/InlineLessonContent";
import { LessonNavigation } from "@/components/course/LessonNavigation";
import { VideoRenderer } from "@/components/course/VideoRenderer";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import eecLogo from "@/assets/eec-logo.png";

const CourseDetail = () => {
  const queryClient = useQueryClient();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, roles } = useAuth();
  const isAdmin = roles.includes('admin') || roles.includes('mega_admin');
  const isMobile = useIsMobile();

  // Staff bypass for sequential locking
  const isStaff = roles.some(r => ['admin', 'mega_admin', 'csm', 'executive'].includes(r));

  // Check how many courses user has access to
  const { userAccess: courseAccessList } = useUserCourseAccess(user?.id);
  const hasMultipleCourses = (courseAccessList?.length || 0) > 1;

  // State
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedPhaseIds, setExpandedPhaseIds] = useState<Set<string>>(new Set());
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const autoCompleteRef = useRef(false);

  // Data fetching — single source of truth
  const { data, isLoading } = useCourseDetail(courseId);
  const { data: quizRequirementsByPhase } = useCourseQuizRequirements(courseId);
  
  // Pass course cache to useInlineTaskDetail so it skips redundant fetches
  const courseCache = useMemo(() => {
    if (!data) return null;
    return {
      tasks: data.tasks,
      phases: data.phases,
      responses: data.responses,
    };
  }, [data]);
  
  const { data: inlineTaskData, isLoading: isLoadingTask } = useInlineTaskDetail(selectedTaskId, courseCache);

  // Unlock status from edge function
  const unlockStatusMap = data?.unlockStatusMap || {};

  // All tasks with status derived from edge function data
  const allPhaseTasks = useMemo(() => {
    if (!data?.tasks || !data?.responses) return [];
    const visibleTasks = data.tasks.filter((t: any) => t.show_in_course !== false);
    return visibleTasks.map((task: any) => ({
      ...task,
      status: data.responses.find((r: any) => r.task_id === task.id)?.status || 'not_started'
    }));
  }, [data]);

  // Quiz status
  const allQuizIds = useMemo(() => {
    if (!quizRequirementsByPhase) return [];
    return Object.values(quizRequirementsByPhase).flat().map((req: any) => req.quizzes?.id).filter(Boolean);
  }, [quizRequirementsByPhase]);
  const { data: quizStatusMap } = useQuizStatus(allQuizIds);

  // Computed values
  const totalTasksCount = data?.totalTasks || 0;
  const completedTasksCount = data?.completedTasks || 0;

  // Extract video section from current task
  const videoSection = useMemo(() => {
    if (!inlineTaskData?.sections) return null;
    return inlineTaskData.sections.find((s: any) => s.section_type === 'video') || null;
  }, [inlineTaskData]);

  // Current task completion status
  const isCurrentTaskCompleted = inlineTaskData?.response?.status === 'completed';

  // Mark as Complete handler
  const handleMarkComplete = useCallback(async () => {
    if (!selectedTaskId || !user || isMarkingComplete) return;
    setIsMarkingComplete(true);
    try {
      await supabase.from('task_responses').upsert(
        {
          task_id: selectedTaskId,
          user_id: user.id,
          status: 'completed',
          completed_at: new Date().toISOString(),
        } as any,
        { onConflict: 'task_id,user_id' }
      );
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      if (user) tryGraduateOnboarding(user.id, selectedTaskId, queryClient);
      queryClient.invalidateQueries({ queryKey: ['course-detail'] });
      queryClient.invalidateQueries({ queryKey: ['inline-task-detail'] });
      toast.success('Lesson marked as complete!');
    } catch {
      toast.error('Failed to mark as complete');
    } finally {
      setIsMarkingComplete(false);
    }
  }, [selectedTaskId, user, isMarkingComplete, queryClient]);

  // Auto-complete when 80% of video is watched
  const handleAutoComplete = useCallback(() => {
    if (isCurrentTaskCompleted || autoCompleteRef.current || isMarkingComplete) return;
    autoCompleteRef.current = true;
    handleMarkComplete();
  }, [isCurrentTaskCompleted, isMarkingComplete, handleMarkComplete]);

  // Reset auto-complete guard when task changes
  useEffect(() => {
    autoCompleteRef.current = false;
  }, [selectedTaskId]);

  // Build phases data for sidebar with sequential locking
  const phases = useMemo(() => {
    if (!data?.tasksByPhase || !allPhaseTasks.length) return [];
    const sortedPhases = data.tasksByPhase.map((phaseData: any) => {
      const phase = phaseData.phase;
      const tasks = allPhaseTasks.filter((t: any) => t.phase_id === phase.id).sort((a: any, b: any) => a.task_order - b.task_order).map((task: any) => ({
        id: task.id,
        title: task.title,
        task_order: task.task_order,
        plan_group: task.plan_group || null,
        status: task.status === 'completed' ? 'completed' as const : task.status === 'in_progress' ? 'in_progress' as const : 'not_started' as const,
        isLocked: false,
      }));
      return {
        id: phase.id,
        title: phase.title,
        phase_order: phase.phase_order,
        tasks,
        isLocked: !unlockStatusMap[phase.id],
        completedCount: tasks.filter((t: any) => t.status === 'completed').length,
        totalCount: tasks.length
      };
    }).sort((a: any, b: any) => a.phase_order - b.phase_order);

    // Apply sequential locking across all phases (clients only)
    if (!isStaff) {
      sortedPhases.forEach((phase, phaseIdx) => {
        phase.tasks.forEach((task, taskIdx) => {
          if (taskIdx > 0) {
            task.isLocked = phase.tasks[taskIdx - 1].status !== 'completed';
          } else if (phaseIdx > 0) {
            const prevPhase = sortedPhases[phaseIdx - 1];
            const lastTaskOfPrev = prevPhase.tasks[prevPhase.tasks.length - 1];
            task.isLocked = !lastTaskOfPrev || lastTaskOfPrev.status !== 'completed';
          } else {
            task.isLocked = false;
          }
        });
        if (phase.tasks.length > 0 && phase.tasks[0].isLocked) {
          phase.isLocked = true;
        }
      });
    }

    return sortedPhases;
  }, [data, unlockStatusMap, allPhaseTasks, isStaff]);

  // Get all tasks in a flat array for navigation
  const allTasks = useMemo(() => {
    if (!data?.tasksByPhase || !allPhaseTasks.length) return [];
    const tasks: Array<{ id: string; phaseId: string; phaseOrder: number; taskOrder: number; }> = [];
    data.tasksByPhase.forEach((phaseData: any) => {
      const phaseTasks = allPhaseTasks.filter((t: any) => t.phase_id === phaseData.phase.id).map((task: any) => ({
        id: task.id,
        phaseId: phaseData.phase.id,
        phaseOrder: phaseData.phase.phase_order,
        taskOrder: task.task_order
      }));
      tasks.push(...phaseTasks);
    });
    return tasks.sort((a, b) => {
      if (a.phaseOrder !== b.phaseOrder) return a.phaseOrder - b.phaseOrder;
      return a.taskOrder - b.taskOrder;
    });
  }, [data, allPhaseTasks]);

  // Current task index for navigation
  const currentTaskIndex = useMemo(() => {
    if (!selectedTaskId) return -1;
    return allTasks.findIndex(t => t.id === selectedTaskId);
  }, [allTasks, selectedTaskId]);
  const hasPrevious = currentTaskIndex > 0;
  const hasNext = currentTaskIndex < allTasks.length - 1 && currentTaskIndex >= 0;

  const noop = () => {};

  // Navigation handlers
  const handleTaskSelect = useCallback((taskId: string, phaseId: string) => {
    setSelectedTaskId(taskId);
    setExpandedPhaseIds(new Set([phaseId]));
  }, []);
  const handlePhaseToggle = useCallback((phaseId: string) => {
    setExpandedPhaseIds(prev =>
      prev.has(phaseId) ? new Set() : new Set([phaseId])
    );
  }, []);
  const navigateToTask = useCallback((direction: 'previous' | 'next') => {
    if (direction === 'previous' && hasPrevious) {
      const prevTask = allTasks[currentTaskIndex - 1];
      handleTaskSelect(prevTask.id, prevTask.phaseId);
    } else if (direction === 'next' && hasNext) {
      const nextTask = allTasks[currentTaskIndex + 1];
      handleTaskSelect(nextTask.id, nextTask.phaseId);
    }
  }, [allTasks, currentTaskIndex, hasPrevious, hasNext, handleTaskSelect]);

  // Auto-select first incomplete task on load
  useEffect(() => {
    if (!data?.tasksByPhase || !allPhaseTasks.length || selectedTaskId) return;
    const tasksWithStatus = allPhaseTasks.map((task: any) => {
      const phase = data.tasksByPhase.find((p: any) => p.phase.id === task.phase_id);
      return {
        id: task.id,
        phaseId: task.phase_id,
        phaseOrder: phase?.phase.phase_order || 0,
        taskOrder: task.task_order,
        isCompleted: task.status === 'completed'
      };
    }).sort((a: any, b: any) => {
      if (a.phaseOrder !== b.phaseOrder) return a.phaseOrder - b.phaseOrder;
      return a.taskOrder - b.taskOrder;
    });
    const firstIncomplete = tasksWithStatus.find((t: any) => !t.isCompleted);
    const targetTask = firstIncomplete || tasksWithStatus[0];
    if (targetTask) {
      setSelectedTaskId(targetTask.id);
      setExpandedPhaseIds(new Set([targetTask.phaseId]));
    }
  }, [data, allPhaseTasks, selectedTaskId]);

  // Handle taskId deep-link
  useEffect(() => {
    const deepLinkTaskId = searchParams.get('taskId');
    if (deepLinkTaskId && allPhaseTasks.length) {
      const task = allPhaseTasks.find((t: any) => t.id === deepLinkTaskId);
      if (task) {
        setSelectedTaskId(task.id);
        setExpandedPhaseIds(new Set([task.phase_id]));
        navigate(`/courses/${courseId}`, { replace: true });
      }
    }
  }, [searchParams, allPhaseTasks, courseId, navigate]);

  // Handle phaseId deep-link
  useEffect(() => {
    const deepLinkPhaseId = searchParams.get('phaseId');
    if (deepLinkPhaseId && allPhaseTasks.length) {
      const firstTaskInPhase = allPhaseTasks
        .filter((t: any) => t.phase_id === deepLinkPhaseId)
        .sort((a: any, b: any) => a.task_order - b.task_order)[0];
      if (firstTaskInPhase) {
        setSelectedTaskId(firstTaskInPhase.id);
        setExpandedPhaseIds(new Set([deepLinkPhaseId]));
        navigate(`/courses/${courseId}`, { replace: true });
      }
    }
  }, [searchParams, allPhaseTasks, courseId, navigate]);

  // Handle resume query param — use data from edge function directly
  useEffect(() => {
    const shouldResume = searchParams.get('resume');
    if (shouldResume === '1' && data?.phases && data?.tasks && data?.responses) {
      const allTasksList: Array<{
        id: string; phaseId: string; phaseOrder: number; taskOrder: number; isCompleted: boolean;
      }> = [];
      data.phases.forEach((phase: any) => {
        const phaseTasks = data.tasks.filter((t: any) => t.phase_id === phase.id);
        phaseTasks.forEach((task: any) => {
          const response = data.responses.find((r: any) => r.task_id === task.id);
          allTasksList.push({
            id: task.id, phaseId: phase.id, phaseOrder: phase.phase_order,
            taskOrder: task.task_order, isCompleted: response?.status === 'completed'
          });
        });
      });
      allTasksList.sort((a, b) => {
        if (a.phaseOrder !== b.phaseOrder) return a.phaseOrder - b.phaseOrder;
        return a.taskOrder - b.taskOrder;
      });
      const firstIncomplete = allTasksList.find(t => !t.isCompleted);
      if (firstIncomplete) {
        setSelectedTaskId(firstIncomplete.id);
        setExpandedPhaseIds(new Set([firstIncomplete.phaseId]));
        navigate(`/courses/${courseId}`, { replace: true });
      }
    }
  }, [searchParams, data, courseId, navigate]);

  // Mark as Complete button component
  const MarkCompleteButton = () => {
    if (!selectedTaskId) return null;
    
    if (isCurrentTaskCompleted) {
      return (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20">
          <Check className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Completed</span>
        </div>
      );
    }

    return (
      <Button
        onClick={handleMarkComplete}
        disabled={isMarkingComplete}
        size="sm"
        className="gap-2"
      >
        {isMarkingComplete ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Completing...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Mark as Complete
          </>
        )}
      </Button>
    );
  };

  if (isLoading) {
    return <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <Skeleton className="h-12 w-96 mb-6" />
          <Skeleton className="h-64 w-full mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </main>;
  }

  if (!data?.hasAccess) {
    return <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <Button variant="ghost" onClick={() => navigate('/courses')} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
          <div className="flex flex-col items-center justify-center py-12">
            <h2 className="text-2xl font-bold mb-2">Course Locked</h2>
            <p className="text-muted-foreground text-center max-w-md">
              You don't have access to this course. Please contact support to
              purchase this course or upgrade your tier.
            </p>
            <Button className="mt-6" onClick={() => navigate('/courses')}>
              Browse Available Courses
            </Button>
          </div>
        </div>
      </main>;
  }

  // Mobile Layout
  if (isMobile) {
    return <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-content">
        {/* Hero Header */}
        <div className="shrink-0 px-4 pt-4 pb-2">
          <div className="flex flex-col items-center text-center space-y-3">
            <img src={eecLogo} alt="Course" className="h-14 w-14" />
            <h1 className="text-2xl font-bold text-foreground">{data?.title}</h1>
            <div className="w-full max-w-xs space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Overall Progress</span>
                <span>{completedTasksCount}/{totalTasksCount} Complete</span>
              </div>
              <Progress value={totalTasksCount ? (completedTasksCount / totalTasksCount) * 100 : 0} />
            </div>
          </div>
        </div>

        {/* Video at Top on Mobile */}
        <div className="flex-1 overflow-y-auto pb-44 px-4 pt-3">
          {selectedTaskId && videoSection && (
            <div className="w-full max-w-3xl mx-auto bg-black rounded-xl overflow-hidden mb-4 aspect-video">
              <VideoRenderer videoSection={videoSection} className="w-full h-full" durationMinutes={inlineTaskData?.duration_minutes} onNextLesson={() => navigateToTask('next')} hasNextLesson={hasNext} onProgress80={handleAutoComplete} />
            </div>
          )}

          {selectedTaskId && <div className="mt-4 bg-card rounded-xl shadow-sm overflow-hidden">
              <InlineLessonContent task={inlineTaskData || null} isLoading={isLoadingTask} isEditMode={false} onEditModeChange={noop} onStartTask={noop} onCompleteTask={noop} onRestartTask={noop} onSubmissionSuccess={noop} isStarting={false} isCompleting={false} isRestarting={false} hideVideo hideHeader contentOnly isAdmin={isAdmin} />
            </div>}

          <PhaseAccordionSidebar phases={phases} selectedTaskId={selectedTaskId} expandedPhaseIds={expandedPhaseIds} onTaskSelect={handleTaskSelect} onPhaseToggle={handlePhaseToggle} />
        </div>

        {/* Bottom Navigation */}
        {selectedTaskId && <div className="fixed bottom-[68px] left-0 right-0 px-4 pb-4 z-10 bg-background">
            <LessonNavigation onPrevious={() => navigateToTask('previous')} onNext={() => navigateToTask('next')} hasPrevious={hasPrevious} hasNext={hasNext} className="bg-card shadow-sm" onMarkComplete={handleMarkComplete} isCompleted={isCurrentTaskCompleted} isMarking={isMarkingComplete} showMarkComplete={!!selectedTaskId} />
          </div>}
      </main>;
  }

  // Desktop Layout
  return <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-content">
      {/* Compact Hero Header */}
      <div className="shrink-0 px-4 py-3 bg-card/30 border-b border-border">
        <div className="flex items-center gap-4">
          <img src={eecLogo} alt="Course" className="h-10 w-10 shrink-0" />

          <div className="flex flex-col min-w-0 mr-2">
            <h1 className="text-lg font-bold text-foreground truncate">
              {inlineTaskData ? inlineTaskData.title : data?.title}
            </h1>
            {inlineTaskData && (
              <p className="text-xs text-muted-foreground truncate">
                Phase {inlineTaskData.phase_order} — {inlineTaskData.phase_title} • Lesson {inlineTaskData.task_order} of {inlineTaskData.total_tasks}
              </p>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0 w-56">
            <Progress value={totalTasksCount ? (completedTasksCount / totalTasksCount) * 100 : 0} className="h-2" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">{completedTasksCount}/{totalTasksCount}</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 flex gap-4 px-4 pb-4 pt-4 min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <div className="shrink-0 w-72 overflow-y-auto bg-card border border-primary/30 rounded-xl p-3">
          <PhaseAccordionSidebar phases={phases} selectedTaskId={selectedTaskId} expandedPhaseIds={expandedPhaseIds} onTaskSelect={handleTaskSelect} onPhaseToggle={handlePhaseToggle} />
        </div>

        {/* Right Panel - Lesson Content with Bottom Navigation */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-card border border-primary/30 rounded-xl p-4">
            {selectedTaskId && videoSection && (
              <div className="w-full max-w-3xl mx-auto bg-black rounded-xl overflow-hidden mb-4 aspect-video">
                <VideoRenderer videoSection={videoSection} className="w-full h-full" durationMinutes={inlineTaskData?.duration_minutes} onNextLesson={() => navigateToTask('next')} hasNextLesson={hasNext} onProgress80={handleAutoComplete} />
              </div>
            )}
            <InlineLessonContent task={inlineTaskData || null} isLoading={isLoadingTask} isEditMode={false} onEditModeChange={noop} onStartTask={noop} onCompleteTask={noop} onRestartTask={noop} onSubmissionSuccess={noop} isStarting={false} isCompleting={false} isRestarting={false} hideVideo hideHeader contentOnly isAdmin={isAdmin} />
            
          </div>
          
          <div className="shrink-0 pt-4">
            <div className="bg-card rounded-xl shadow-sm p-4 border border-primary/30">
              <LessonNavigation onPrevious={() => navigateToTask('previous')} onNext={() => navigateToTask('next')} hasPrevious={hasPrevious} hasNext={hasNext} onMarkComplete={handleMarkComplete} isCompleted={isCurrentTaskCompleted} isMarking={isMarkingComplete} showMarkComplete={!!selectedTaskId} />
            </div>
          </div>
        </div>
      </div>
    </main>;
};
export default CourseDetail;
