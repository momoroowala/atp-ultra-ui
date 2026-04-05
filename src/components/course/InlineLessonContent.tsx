import { useState } from 'react';
import { Edit2, RotateCcw, Loader2, Check, X, Clock, Award, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SecureYouTubePlayer } from '@/components/learning/SecureYouTubePlayer';
import { VidalyticsPlayer } from '@/components/learning/VidalyticsPlayer';
import { TaskSubmissionForm } from '@/components/learning/TaskSubmissionForm';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { getVimeoEmbedUrl } from '@/utils/videoEmbedHelpers';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  section_type: string;
  title: string | null;
  data: any;
}

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  points: number;
  duration_minutes: number | null;
  phase_title: string;
  phase_order: number;
  task_order: number;
  total_tasks: number;
  sections: Section[];
  response?: {
    status: string;
    completed_at: string | null;
  } | null;
  submission?: {
    data: Record<string, any>;
    created_at: string;
  } | null;
}

interface InlineLessonContentProps {
  task: TaskData | null;
  isLoading: boolean;
  isEditMode: boolean;
  onEditModeChange: (editing: boolean) => void;
  onStartTask: () => void;
  onCompleteTask: () => void;
  onRestartTask: () => void;
  onSubmissionSuccess: () => void;
  isStarting: boolean;
  isCompleting: boolean;
  isRestarting: boolean;
  hideVideo?: boolean;
  hideHeader?: boolean;
  /** When true, renders only video + readout content — no forms, no task action buttons */
  contentOnly?: boolean;
  /** Fires once when ≥ 80% of the video has been watched */
  onProgress80?: () => void;
}

export function InlineLessonContent({
  task,
  isLoading,
  isEditMode,
  onEditModeChange,
  onStartTask,
  onCompleteTask,
  onRestartTask,
  onSubmissionSuccess,
  isStarting,
  isCompleting,
  isRestarting,
  hideVideo = false,
  hideHeader = false,
  contentOnly = false,
  onProgress80,
}: InlineLessonContentProps) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 min-h-[50vh]">
        <BookOpen className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm">Select a lesson to get started</p>
        <p className="text-xs text-muted-foreground/60">Choose a module on the left to begin</p>
      </div>
    );
  }

  const isCompleted = task.response?.status === 'completed';
  const isNotStarted = !task.response || task.response.status === 'not_started';
  const sections = task.sections || [];
  const hasForm = sections.some(s => s.section_type === 'form');
  const submissionData = task.submission?.data || {};

  // Find video section
  const videoSection = sections.find(s => s.section_type === 'video');
  const readoutSection = sections.find(s => s.section_type === 'readout');

  const renderVideo = () => {
    if (!videoSection?.data) return null;
    
    const data = videoSection.data;
    if (typeof data !== 'object') return null;

    if ('embed_url' in data && data.embed_url) {
      const embedUrl = String(data.embed_url);
      return (
        <div className="iframe-wrapper">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={videoSection.title || "Video"}
          />
        </div>
      );
    }

    if ('video_url' in data && data.video_url) {
      const raw = String(data.video_url);
      const isYouTube = /youtu\.?be/.test(raw) || raw.includes("youtube.com");
      const isVimeo = raw.includes("vimeo.com");
      const isDrive = raw.includes("drive.google.com") || raw.includes("docs.google.com");
      const isVidalytics = raw.includes("vidalytics.com") || raw.includes("preview.vidalytics.com");

      if (isVidalytics) {
        const vidMatch = raw.match(/vidalytics\.com\/vid\/([^?&#/]+)/) || 
                       raw.match(/vidalytics_embed_([^?&#/\s]+)/);
        const videoId = vidMatch ? vidMatch[1] : null;
        return videoId ? (
          <VidalyticsPlayer videoId={videoId} title={videoSection.title || "Video"} onProgress80={onProgress80} durationMinutes={task?.duration_minutes} />
        ) : null;
      }

      if (isYouTube) {
        const ytIdMatch = raw.match(/[?&]v=([^&#]+)/) || raw.match(/youtu\.be\/([^?&#/]+)/);
        const ytId = ytIdMatch ? ytIdMatch[1] : null;
        
        return ytId ? (
          <SecureYouTubePlayer videoId={ytId} title={videoSection.title || "Video"} onProgress80={onProgress80} />
        ) : null;
      }

      if (isVimeo) {
        const embedSrc = getVimeoEmbedUrl(raw);
        if (embedSrc) {
          return (
            <div className="iframe-wrapper relative select-none">
              <div className="absolute top-0 left-0 right-0 h-[15%] z-10" />
              <iframe
                src={embedSrc}
                className="w-full h-full pointer-events-auto"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={videoSection.title || "Video"}
              />
            </div>
          );
        }
      }

      if (isDrive) {
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
          return (
            <div className="iframe-wrapper relative select-none">
              <iframe
                src={preview}
                className="w-full h-full pointer-events-auto"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={videoSection.title || "Video"}
              />
            </div>
          );
        }
      }

      return <video src={raw} controls controlsList="nodownload" onContextMenu={e => e.preventDefault()} className="w-full h-full" playsInline />;
    }

    return null;
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Top Header Bar */}
      {!hideHeader && !contentOnly && (
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background sticky top-0 z-10">
        <div className="text-sm text-muted-foreground">
          Phase {task.phase_order} - {task.phase_title} • Lesson {task.task_order} Of {task.total_tasks}
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && !isEditMode && hasForm && (
            <Button variant="outline" size="sm" onClick={() => onEditModeChange(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {isCompleted && !isEditMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRestartTask}
              disabled={isRestarting}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {isRestarting ? "Restarting..." : "Restart"}
            </Button>
          )}
        </div>
      </div>
      )}

      <div className="flex-1 p-6 pb-32">
        {/* Video Player */}
        {!hideVideo && videoSection && (
          <div className="aspect-video rounded-xl overflow-hidden bg-muted mb-6">
            {renderVideo()}
          </div>
        )}

        {/* Lesson Title */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
        </div>

        {/* Meta Badges */}
        <div className="flex items-center gap-3 mb-6">
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

        {/* Separator */}
        <div className="border-t border-dashed border-border my-6" />

        {/* Description */}
        {task.description && (
          <div className="mb-6">
            <p className="text-foreground leading-relaxed">{task.description}</p>
          </div>
        )}

        {/* Reading Content */}
        {readoutSection?.data && typeof readoutSection.data === 'object' && 'content_html' in readoutSection.data && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">What You'll Learn:</h3>
            <div
              className="prose prose-sm max-w-none text-foreground [&_*]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-2"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(readoutSection.data.content_html)) }}
            />
          </div>
        )}

        {/* Form Section */}
        {!contentOnly && hasForm && (
          <div className="mt-8">
            {isCompleted && !isEditMode ? (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
                <p className="text-sm font-medium text-foreground mb-4">
                  ✓ Submitted on {new Date(task.submission?.created_at || '').toLocaleDateString()}
                </p>
                <div className="space-y-4">
                  {Object.entries(submissionData).map(([key, value]) => {
                    const isFileUpload =
                      Array.isArray(value) &&
                      value.length > 0 &&
                      typeof value[0] === "string" &&
                      value[0].includes("supabase.co/storage");

                    return (
                      <div key={key} className="border-b border-border/30 pb-3 last:border-0">
                        <p className="text-sm font-semibold capitalize mb-2 text-foreground">
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
                          <Check className="h-5 w-5 text-primary" />
                            ) : (
                              <X className="h-5 w-5 text-destructive" />
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-foreground leading-relaxed">{String(value)}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <TaskSubmissionForm
                task={task as any}
                initialData={isEditMode ? (submissionData as Record<string, any>) : undefined}
                isEditing={isEditMode}
                onSuccess={onSubmissionSuccess}
                onCancel={() => onEditModeChange(false)}
              />
            )}
          </div>
        )}

        {/* Start/Complete Button for non-form tasks */}
        {!contentOnly && !hasForm && !isCompleted && (
          <div className="mt-8">
            {isNotStarted ? (
              <Button
                onClick={onStartTask}
                disabled={isStarting}
                className="w-full"
                size="lg"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Start Lesson"
                )}
              </Button>
            ) : (
              <Button
                onClick={onCompleteTask}
                disabled={isCompleting}
                className="w-full"
                size="lg"
              >
                {isCompleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing...
                  </>
                ) : (
                  "Mark as Complete"
                )}
              </Button>
            )}
          </div>
        )}

        {/* Completed state for non-form tasks */}
        {!contentOnly && !hasForm && isCompleted && (
          <div className="mt-8 bg-primary/5 border border-primary/20 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  ✓ Completed on{" "}
                  {task.response?.completed_at
                    ? new Date(task.response.completed_at).toLocaleDateString()
                    : "Unknown date"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  You earned {task.points} points for completing this lesson.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onRestartTask}
                disabled={isRestarting}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {isRestarting ? "Restarting..." : "Restart"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
