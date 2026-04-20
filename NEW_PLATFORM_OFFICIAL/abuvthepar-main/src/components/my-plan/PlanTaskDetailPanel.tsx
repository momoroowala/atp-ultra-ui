import { useState, useMemo, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Play, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInlineTaskDetail } from "@/hooks/useInlineTaskDetail";
import { InlineLessonContent } from "@/components/course/InlineLessonContent";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface PlanTaskDetailPanelProps {
  taskId: string | null;
}

export const PlanTaskDetailPanel = ({ taskId }: PlanTaskDetailPanelProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);

  const {
    data: taskData,
    isLoading,
    refetch: refetchTask,
  } = useInlineTaskDetail(taskId);

  // Check if task has a linked module or its own video section
  const hasVideo = useMemo(() => {
    if (!taskData) return false;
    if (taskData.linked_module_id) return true;
    return taskData.sections?.some((s) => s.section_type === "video") ?? false;
  }, [taskData]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["inline-task-detail"] });
    queryClient.invalidateQueries({ queryKey: ["phase-tasks-detail"] });
    queryClient.invalidateQueries({ queryKey: ["tasks-with-sections"] });
    queryClient.invalidateQueries({ queryKey: ["phases-with-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["phase-unlock-status"] });
  };

  const startTaskMutation = useMutation({
    mutationFn: async () => {
      if (!taskId || !user) throw new Error("Missing data");
      const { error } = await supabase.from("task_responses").upsert(
        { user_id: user.id, task_id: taskId, status: "in_progress" },
        { onConflict: "user_id,task_id" }
      );
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const completeTaskMutation = useMutation({
    mutationFn: async () => {
      if (!taskId || !user || !taskData) throw new Error("Missing data");
      const { error } = await supabase.from("task_responses").upsert(
        {
          user_id: user.id,
          task_id: taskId,
          status: "completed",
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,task_id" }
      );
      if (error) throw error;
      await supabase.rpc("award_points_for_task", {
        p_task_id: taskId,
        p_points: taskData.points,
        p_description: `Completed: ${taskData.title}`,
      });
    },
    onSuccess: () => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success("Task completed!", {
        description: `+${taskData?.points} points earned`,
      });
      invalidateAll();
    },
  });

  const restartTaskMutation = useMutation({
    mutationFn: async () => {
      if (!taskId || !user) throw new Error("Missing data");
      const { error } = await supabase
        .from("task_responses")
        .update({ status: "in_progress", completed_at: null })
        .eq("user_id", user.id)
        .eq("task_id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      setIsEditMode(false);
      invalidateAll();
    },
  });

  const autoCompleteRef = useRef(false);

  // Reset auto-complete guard when task changes
  const handleAutoComplete = useCallback(() => {
    if (taskData?.response?.status === 'completed' || autoCompleteRef.current || completeTaskMutation.isPending) return;
    autoCompleteRef.current = true;
    completeTaskMutation.mutate();
  }, [taskData, completeTaskMutation]);

  if (!taskId || (!isLoading && !taskData)) {
    autoCompleteRef.current = false;
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 min-h-[400px]">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-primary/50" />
        </div>
        <p className="text-sm font-medium">Select a task to get started</p>
        <p className="text-xs text-muted-foreground/60">
          Choose a task from the left panel to view details
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Video Link Card */}
      {hasVideo && taskData && (
        <div className="mx-6 mt-6 mb-2">
          <button
            onClick={() => {
              const targetTaskId = taskData.linked_module_id || taskData.id;
              navigate(
                `/courses/${taskData.course_id}?taskId=${targetTaskId}`
              );
            }}
            className="w-full group relative flex items-center gap-4 rounded-xl bg-black/90 p-4 text-left transition-all hover:bg-black"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
              <Play className="h-5 w-5 text-primary fill-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                Watch Video Lesson
              </p>
              <p className="text-xs text-white/60 truncate">
                Open in course player
              </p>
            </div>
            <ExternalLink className="h-4 w-4 text-white/40 shrink-0" />
          </button>
        </div>
      )}

      <InlineLessonContent
        task={taskData || null}
        isLoading={isLoading}
        isEditMode={isEditMode}
        onEditModeChange={setIsEditMode}
        onStartTask={() => startTaskMutation.mutate()}
        onCompleteTask={() => completeTaskMutation.mutate()}
        onRestartTask={() => restartTaskMutation.mutate()}
        onSubmissionSuccess={() => {
          refetchTask();
          setIsEditMode(false);
          invalidateAll();
        }}
        isStarting={startTaskMutation.isPending}
        isCompleting={completeTaskMutation.isPending}
        isRestarting={restartTaskMutation.isPending}
        hideVideo
      />
    </div>
  );
};
