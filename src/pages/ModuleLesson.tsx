import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Clock, Award, Loader2, Edit2, Check, X } from "lucide-react";
import { useTaskDetail } from "@/hooks/useTaskDetail";
import { useCourseTaskProgress } from "@/hooks/useCourseTaskProgress";
import { useCourseQuizRequirements } from "@/hooks/useCourseQuizRequirements";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskSubmissionForm } from "@/components/learning/TaskSubmissionForm";
import { SecureYouTubePlayer } from "@/components/learning/SecureYouTubePlayer";
import { VidalyticsPlayer } from "@/components/learning/VidalyticsPlayer";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import { getVimeoEmbedUrl } from "@/utils/videoEmbedHelpers";
import { tryGraduateOnboarding } from "@/utils/onboardingGraduation";

export default function TaskLesson() {
  const { courseId, moduleId } = useParams<{ courseId: string; moduleId: string }>();
  const taskId = moduleId; // For backward compatibility with existing code
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: taskDetail, isLoading, error } = useTaskDetail(taskId);
  const { data: courseProgress } = useCourseTaskProgress(courseId);
  const { data: quizRequirementsByPhase } = useCourseQuizRequirements(courseId);
  const [isStarting, setIsStarting] = useState(false);
  const [searchParams] = useSearchParams();
  const [isEditMode, setIsEditMode] = useState(searchParams.get("mode") === "edit");
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Reset transitioning state and scroll to top when taskId changes (after navigation)
  useEffect(() => {
    setIsTransitioning(false);
    window.scrollTo(0, 0);
  }, [taskId]);

  // Get the task from detail
  const task = taskDetail?.task;

  // Calculate derived values
  const sections = task?.sections || [];
  const formFields = task?.formFields || [];
  const hasForm = formFields.length > 0;
  const isVideoOrReading = task?.task_type === "video" || task?.task_type === "reading";
  const isCompleted = task?.response?.status === "completed";
  const isNotStarted = !task?.response || task?.response?.status === "pending";
  const submissionData = (task?.submission as any)?.submission_data || {};
  const dueDate =
    task?.due_date_enabled && task?.due_date_days
      ? new Date(Date.now() + task.due_date_days * 24 * 60 * 60 * 1000)
      : null;


  // Start task mutation
  const startTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task || !user) throw new Error("Task or user not found");

      const { error } = await supabase.from("task_responses").upsert(
        {
          task_id: task.id,
          user_id: user.id,
          status: "in_progress",
          started_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,task_id",
        },
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-detail"] });
      queryClient.invalidateQueries({ queryKey: ["phase-tasks-detail"] });
      queryClient.invalidateQueries({ queryKey: ["course-task-progress"] });
      toast.success("Course started!");
    },
    onError: (error) => {
      console.error("Error starting task:", error);
      toast.error("Failed to start course");
    },
  });

  // Restart course mutation
  const restartTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task || !user) throw new Error("Task or user not found");

      // Update task response to in_progress and clear completed_at
      const { error: taskError } = await supabase
        .from("task_responses")
        .update({
          status: "in_progress",
          completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("task_id", task.id);

      if (taskError) throw taskError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-detail"] });
      queryClient.invalidateQueries({ queryKey: ["phase-tasks-detail"] });
      queryClient.invalidateQueries({ queryKey: ["course-task-progress"] });
      toast.success("Course restarted! You can now submit again.");
      setIsEditMode(false);
    },
    onError: (error) => {
      console.error("Error restarting task:", error);
      toast.error("Failed to restart course");
    },
  });

  // Mark task as complete mutation
  const completeTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task || !user) throw new Error("Task or user not found");

      // Session guard: verify auth before proceeding
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUserId = sessionData?.session?.user?.id;
      if (!sessionUserId || sessionUserId !== user.id) {
        throw new Error("Your session has expired. Please sign in again and retry.");
      }

      const { error } = await supabase.from("task_responses").upsert(
        {
          task_id: task.id,
          user_id: user.id,
          status: "completed",
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,task_id",
        },
      );

      if (error) throw error;

      // Award points using secure RPC
      const { error: rpcError } = await supabase.rpc("award_points_for_task", {
        p_task_id: task.id,
        p_points: task.points,
        p_description: `Completed: ${task.title}`,
        p_activity_type: "task_completion",
      });

      if (rpcError && !rpcError.message?.includes("already")) {
        throw rpcError;
      }
    },
    onSuccess: () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success("🎉 Congratulations!", {
        description: `Task completed! You earned ${task?.points || 0} points!`,
      });

      queryClient.invalidateQueries({ queryKey: ["task-detail"] });
      queryClient.invalidateQueries({ queryKey: ["phase-tasks-detail"] });
      queryClient.invalidateQueries({ queryKey: ["course-task-progress"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
      if (user && task) tryGraduateOnboarding(user.id, task.id, queryClient);

      // Navigate back to course page and scroll to next incomplete task
      setIsTransitioning(true);
      setTimeout(() => {
        navigate(`/courses/${courseId}?scrollToNext=true`);
        setIsTransitioning(false);
      }, 1500);
    },
    onError: (error) => {
      console.error("Error completing task:", error);
      toast.error("Failed to complete task");
    },
  });

  // Auto-start task when user lands on the page if it's not started yet
  useEffect(() => {
    if (task && user && isNotStarted && !startTaskMutation.isPending) {
      startTaskMutation.mutate();
    }
  }, [task?.id, user?.id, isNotStarted]);

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center min-w-0">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  if (error || !task) {
    return (
      <main className="flex-1 flex items-center justify-center min-w-0">
        <div className="text-center p-6">
          <p className="text-destructive mb-4">{error ? "Error loading module" : "Module not found"}</p>
          <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>
            Back to Course
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-content">
      {/* Transition Loading Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-foreground">Loading next course...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/courses/${courseId}`)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{task.title}</h1>
            {task.phases && <p className="text-xs text-muted-foreground">{task.phases.title}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {task.duration_minutes && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {task.duration_minutes} min
            </Badge>
          )}
          <Badge variant="outline" className="gap-1">
            <Award className="h-3 w-3" />
            {task.points} pts
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Task Overview */}
          {task.description && (
            <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📋</div>
                  <CardTitle className="text-xl text-foreground">What You'll Learn</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground leading-relaxed text-base">{task.description}</p>
                {dueDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-3 border-t border-border/50">
                    <span>📅 Due: {dueDate.toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Lesson Content Sections */}
          {sections.length > 0 &&
            sections
              .filter((section) => {
                // Filter out form sections (handled separately below)
                if (section.section_type === "form") return false;
                // Filter out sections with no data
                if (!section.data || (typeof section.data === "object" && Object.keys(section.data).length === 0))
                  return false;
                return true;
              })
              .map((section) => (
                <Card
                  key={section.id}
                  className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{section.section_type === "video" ? "🎥" : "📖"}</div>
                      <CardTitle className="text-xl text-foreground">
                        {section.title || (section.section_type === "video" ? "Video Lesson" : "Reading Material")}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {section.section_type === "readout" &&
                      section.data &&
                      typeof section.data === "object" &&
                      "content_html" in section.data && (
                        <div
                          className="prose prose-sm max-w-none text-foreground [&_*]:text-foreground"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(section.data.content_html)) }}
                        />
                      )}

                    {section.section_type === "video" && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        {section.data && typeof section.data === "object" ? (
                          "embed_url" in section.data && section.data.embed_url ? (
                            <div className="iframe-wrapper">
                              <iframe
                                src={String(section.data.embed_url)}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={section.title || "Video"}
                              />
                            </div>
                          ) : "video_url" in section.data && section.data.video_url ? (
                            (() => {
                              const raw = String(section.data.video_url);
                              const isYouTube = /youtu\.?be/.test(raw) || raw.includes("youtube.com");
                              const isVimeo = raw.includes("vimeo.com");
                              const isDrive = raw.includes("drive.google.com") || raw.includes("docs.google.com");
                              const isVidalytics = raw.includes("vidalytics.com") || raw.includes("preview.vidalytics.com");

                              if (isVidalytics) {
                                const vidMatch = raw.match(/vidalytics\.com\/vid\/([^?&#/]+)/) || 
                                               raw.match(/vidalytics_embed_([^?&#/\s]+)/);
                                const videoId = vidMatch ? vidMatch[1] : null;
                                
                                return videoId ? (
                                  <VidalyticsPlayer
                                    videoId={videoId}
                                    title={section.title || "Video"}
                                  />
                                ) : (
                                  <p className="text-muted-foreground text-center py-8">
                                    Invalid Vidalytics URL
                                  </p>
                                );
                              }

                              if (isYouTube) {
                                const ytIdMatch = raw.match(/[?&]v=([^&#]+)/) || raw.match(/youtu\.be\/([^?&#/]+)/);
                                const ytId = ytIdMatch ? ytIdMatch[1] : null;
                                
                                return ytId ? (
                                  <SecureYouTubePlayer
                                    videoId={ytId}
                                    title={section.title || "Video"}
                                  />
                                ) : (
                                  <p className="text-muted-foreground text-center py-8">
                                    Invalid YouTube URL
                                  </p>
                                );
                              }

                              // For Vimeo and Google Drive, use iframe with security protections
                              let embedSrc: string | null = null;

                              if (isVimeo) {
                                embedSrc = getVimeoEmbedUrl(raw);
                              } else if (isDrive) {
                                let preview = raw
                                  .replace(/\/view(\?.*)?$/, "/preview")
                                  .replace(/\/download(\?.*)?$/, "/preview");
                                if (!/\/file\/d\//.test(preview)) {
                                  const idMatch = raw.match(/\/file\/d\/([^/]+)/) || raw.match(/[?&]id=([^&#]+)/);
                                  const fileId = idMatch ? idMatch[1] : null;
                                  if (fileId) {
                                    preview = `https://drive.google.com/file/d/${fileId}/preview`;
                                  }
                                }
                                if (/drive\.google\.com\/file\/d\/.+\/preview/.test(preview)) {
                                  embedSrc = preview;
                                }
                              }

                              return embedSrc ? (
                                <div 
                                  className="iframe-wrapper relative select-none"
                                  onContextMenu={(e) => e.preventDefault()}
                                  onDragStart={(e) => e.preventDefault()}
                                >
                                  <iframe
                                    src={embedSrc}
                                    className="w-full h-full pointer-events-auto"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={section.title || "Video"}
                                  />
                                </div>
                              ) : (
                                <video src={raw} controls className="w-full h-full" playsInline />
                              );
                            })()
                          ) : (
                            <div className="flex items-center justify-center h-full text-white">No video available</div>
                          )
                        ) : (
                          <div className="flex items-center justify-center h-full text-white">No video available</div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

          {/* Form Section */}
          {hasForm && (
            <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 pb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{isCompleted && !isEditMode ? "✅" : isEditMode ? "✏️" : "📝"}</div>
                  <CardTitle className="text-xl text-white">
                    {isCompleted && !isEditMode
                      ? "Your Submission"
                      : isEditMode
                        ? "Edit Your Submission"
                        : sections.find((s) => s.section_type === "form")?.title || "Complete Your Submission"}
                  </CardTitle>
                </div>
                {isCompleted && !isEditMode && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restartTaskMutation.mutate()}
                      disabled={restartTaskMutation.isPending}
                    >
                      {restartTaskMutation.isPending ? "Restarting..." : "Restart Course"}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isCompleted && !isEditMode ? (
                  <div className="space-y-4">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
                      <p className="text-sm font-medium text-white mb-4">
                        ✓ Submitted on {new Date(task.submission?.created_at).toLocaleDateString()}
                      </p>
                      <div className="space-y-4">
                        {Object.entries(submissionData).map(([key, value]) => {
                          // Check if value is an array of URLs (file upload field)
                          const isFileUpload =
                            Array.isArray(value) &&
                            value.length > 0 &&
                            typeof value[0] === "string" &&
                            value[0].includes("supabase.co/storage");

                          return (
                            <div key={key} className="border-b border-border/30 pb-3 last:border-0">
                              <p className="text-sm font-semibold capitalize mb-2 text-white">
                                {key.replace(/_/g, " ")}
                              </p>
                              {isFileUpload ? (
                                <ul className="space-y-1">
                                  {(value as string[]).map((url, idx) => {
                                    const fileName = url.split("/").pop() || url;
                                    return (
                                      <li key={idx}>
                                        <a
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-primary hover:underline"
                                        >
                                          {fileName}
                                        </a>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : typeof value === 'boolean' ? (
                                <div className="flex items-center gap-2">
                                  {value ? (
                                    <Check className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <X className="h-5 w-5 text-red-500" />
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-white leading-relaxed">{String(value)}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <TaskSubmissionForm
                    task={task as any}
                    initialData={isEditMode ? (submissionData as Record<string, any>) : undefined}
                    isEditing={isEditMode}
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ["tasks-with-sections"] });

                      if (isEditMode) {
                        setIsEditMode(false);
                        return;
                      }

                      // Navigate back to course page and scroll to next incomplete task
                      setIsTransitioning(true);
                      setTimeout(() => {
                        navigate(`/courses/${courseId}?scrollToNext=true`);
                        setIsTransitioning(false);
                      }, 1500);
                    }}
                    onCancel={() => {
                      if (isEditMode) {
                        setIsEditMode(false);
                      } else {
                        navigate(`/courses/${courseId}`);
                      }
                    }}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Start Course / Mark Complete Button */}
          {!hasForm && !isCompleted && (
            <Card className="border-primary/20 shadow-sm">
              <CardContent className="pt-6">
                {isNotStarted ? (
                  <Button
                    onClick={() => startTaskMutation.mutate()}
                    disabled={startTaskMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {startTaskMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      "Start Course"
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => completeTaskMutation.mutate()}
                    disabled={completeTaskMutation.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {completeTaskMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      "Mark as Complete"
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Completed tasks without forms - show content + restart */}
          {!hasForm && isCompleted && (
            <Card className="border-success/20 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">✅</div>
                    <CardTitle className="text-xl">Task Completed</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restartTaskMutation.mutate()}
                    disabled={restartTaskMutation.isPending}
                  >
                    {restartTaskMutation.isPending ? "Restarting..." : "Restart Course"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                  <p className="text-sm font-medium">
                    ✓ Completed on{" "}
                    {task.response?.completed_at
                      ? new Date(task.response.completed_at).toLocaleDateString()
                      : "Unknown date"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You earned {task.points} points for completing this course.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

    </main>
  );
}
