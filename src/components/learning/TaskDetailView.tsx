import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { usePhaseTasksDetail } from '@/hooks/usePhaseTasksDetail';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Task } from '@/hooks/usePhasesWithTasks';
import { Clock, Trophy, Play, CheckCircle, Edit2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TaskSubmissionForm } from './TaskSubmissionForm';
import confetti from 'canvas-confetti';
import { tryGraduateOnboarding } from '@/utils/onboardingGraduation';

interface TaskDetailViewProps {
  task: Task | null;
  currentStatus: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailView = ({
  task,
  currentStatus,
  isOpen,
  onClose,
}: TaskDetailViewProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Get current phase ID from task
  const currentPhaseId = (task as any)?.phases?.id || task?.phase_id;
  const { data: phaseTasksData } = usePhaseTasksDetail(currentPhaseId);
  
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const isCompleted = (task as any)?.response?.status === 'completed';
  const submissionData = (task as any)?.submission?.data || {};

  // Find next open task within the same phase
  const findNextOpenTask = () => {
    if (!phaseTasksData?.tasks || !task) return null;
    
    // Find current task index
    const currentIndex = phaseTasksData.tasks.findIndex(t => t.id === task.id);
    if (currentIndex === -1) return null;
    
    // Find next task that's not completed
    for (let i = currentIndex + 1; i < phaseTasksData.tasks.length; i++) {
      const nextTask = phaseTasksData.tasks[i];
      const response = nextTask.response;
      
      if (!response || response.status !== 'completed') {
        return nextTask.id;
      }
    }
    
    return null;
  };

  const startTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from('task_responses').upsert({
        user_id: user!.id,
        task_id: taskId,
        status: 'in_progress',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-progress'] });
      toast.success('Module started!');
    },
  });

  const restartTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('task_responses')
        .update({
          status: 'in_progress',
          completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user!.id)
        .eq('task_id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-with-sections'] });
      queryClient.invalidateQueries({ queryKey: ['task-progress'] });
      queryClient.invalidateQueries({ queryKey: ['phase-tasks-detail'] });
      queryClient.invalidateQueries({ queryKey: ['course-task-progress'] });
      queryClient.invalidateQueries({ queryKey: ['task-detail'] });
      queryClient.invalidateQueries({ queryKey: ['phases-with-tasks'] });
      toast.success('Course restarted! You can now submit again.');
      setIsEditMode(false);
      setShowSubmissionForm(false);
    },
    onError: (error) => {
      console.error('Error restarting task:', error);
      toast.error('Failed to restart course');
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // Session guard: verify auth before proceeding
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUserId = sessionData?.session?.user?.id;
      if (!sessionUserId || sessionUserId !== user!.id) {
        throw new Error('Your session has expired. Please sign in again and retry.');
      }

      const { error: responseError } = await supabase
        .from('task_responses')
        .upsert({
          user_id: user!.id,
          task_id: taskId,
          status: 'completed',
          completed_at: new Date().toISOString(),
        });

      if (responseError) throw responseError;

      // Award points using secure RPC
      const { error: rpcError } = await supabase.rpc('award_points_for_task', {
        p_task_id: taskId,
        p_points: task!.points,
        p_description: `Completed: ${task!.title}`,
        p_activity_type: 'task_completion',
      });

      if (rpcError && !rpcError.message?.includes('already')) {
        throw rpcError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-with-sections'] });
      queryClient.invalidateQueries({ queryKey: ['task-progress'] });
      queryClient.invalidateQueries({ queryKey: ['phases-with-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      if (user && task) tryGraduateOnboarding(user.id, task.id, queryClient);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      
      toast.success('🎉 Congratulations!', {
        description: `Task completed! You earned ${task?.points} points!`,
      });
      
      onClose();
      
      // Find next open task and navigate
      const nextTaskId = findNextOpenTask();
      
      setTimeout(() => {
        if (nextTaskId) {
          navigate(`/task-lesson/${nextTaskId}`);
        } else {
          toast.success('✨ All modules completed!', {
            description: 'Great work! Check your progress on the dashboard.',
          });
          navigate('/courses');
        }
      }, 2000);
    },
  });

  if (!task) return null;

  const handleStartTask = () => {
    startTaskMutation.mutate(task.id);
  };

  const handleCompleteTask = () => {
    completeTaskMutation.mutate(task.id);
  };

  const handleSubmit = () => {
    setShowSubmissionForm(true);
  };

  const renderTaskContent = () => {
    switch (task.task_type) {
      case 'video':
        return (
          <div className="space-y-4">
            {task.content_url && (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="iframe-wrapper">
                  <iframe
                    src={task.content_url}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        );
      
      case 'reading':
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {task.content?.text && <ReactMarkdown>{task.content.text}</ReactMarkdown>}
          </div>
        );
      
      default:
        return (
          <div className="text-muted-foreground">
            Module content will be displayed here.
          </div>
        );
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{task.task_type}</Badge>
            <Badge variant="secondary">
              {currentStatus === 'completed' ? 'Completed' : 'Active'}
            </Badge>
          </div>
          <SheetTitle className="text-2xl">{task.title}</SheetTitle>
          {task.description && (
            <SheetDescription>{task.description}</SheetDescription>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {task.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {task.duration_minutes} min
              </span>
            )}
            <span className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              {task.points} points
            </span>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {renderTaskContent()}

          {showSubmissionForm ? (
            <TaskSubmissionForm
              task={task}
              initialData={isEditMode ? submissionData : undefined}
              isEditing={isEditMode}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['tasks-with-sections'] });
                queryClient.invalidateQueries({ queryKey: ['task-progress'] });
                queryClient.invalidateQueries({ queryKey: ['phases-with-tasks'] });
                
                setShowSubmissionForm(false);
                setIsEditMode(false);
                onClose();
                
                // Find next open task and navigate
                const nextTaskId = findNextOpenTask();
                
                setTimeout(() => {
                  if (nextTaskId) {
                    navigate(`/task-lesson/${nextTaskId}`);
                  } else {
                    toast.success('✨ All modules completed!', {
                      description: 'Great work! Check your progress on the dashboard.',
                    });
                    navigate('/courses');
                  }
                }, 2000);
              }}
              onCancel={() => {
                setShowSubmissionForm(false);
                setIsEditMode(false);
              }}
            />
          ) : (
            <div className="flex gap-2">
              {currentStatus === 'pending' && (
                <Button onClick={handleStartTask} className="gap-2">
                  <Play className="h-4 w-4" />
                  Start Task
                </Button>
              )}
              {currentStatus === 'in_progress' && (
                <>
                  {['video', 'reading'].includes(task.task_type) ? (
                    <Button onClick={handleCompleteTask} className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Mark Complete
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} className="gap-2">
                      Submit Module
                    </Button>
                  )}
                </>
              )}
              {isCompleted && (
                <>
                  <Button onClick={() => {
                    setIsEditMode(true);
                    setShowSubmissionForm(true);
                  }} variant="outline" className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    Edit Submission
                  </Button>
                  <Button 
                    onClick={() => restartTaskMutation.mutate(task.id)} 
                    variant="outline" 
                    className="gap-2"
                    disabled={restartTaskMutation.isPending}
                  >
                    {restartTaskMutation.isPending ? 'Restarting...' : 'Restart Course'}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
