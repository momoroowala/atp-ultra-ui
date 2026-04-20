import { X, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TaskSectionPreview } from './TaskSectionPreview';
import { getStatusLabel } from '@/utils/taskStatusHelper';
import { format } from 'date-fns';
import { SecureYouTubePlayer } from '@/components/learning/SecureYouTubePlayer';
import { VidalyticsPlayer } from '@/components/learning/VidalyticsPlayer';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { getVimeoEmbedUrl } from '@/utils/videoEmbedHelpers';

interface TaskDetailModalProps {
  task: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartTask: () => void;
}

export const TaskDetailModal = ({ task, open, onOpenChange, onStartTask }: TaskDetailModalProps) => {
  const navigate = useNavigate();
  if (!task) return null;

  const isCompleted = task.response?.status === 'completed';
  const hasSubmission = task.submission && Object.keys(task.submission.data || {}).length > 0;
  const isStarted = Boolean(task.response?.started_at) || ['in_progress', 'completed'].includes(task.response?.status || '');

  const renderSectionContent = (section: any) => {
    switch (section.section_type) {
      case 'video':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{section.title}</h4>
            {section.data?.subtitle && <p className="text-sm text-muted-foreground">{section.data.subtitle}</p>}
            {!isStarted ? (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Video player will appear when task is started</p>
              </div>
            ) : (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                {section.data && typeof section.data === 'object' ? (
                  'embed_url' in section.data && section.data.embed_url ? (
                    <div className="iframe-wrapper">
                      <iframe
                        src={String(section.data.embed_url)}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={section.title || 'Video'}
                      />
                    </div>
                  ) : 'video_url' in section.data && section.data.video_url ? (
                    (() => {
                      const raw = String(section.data.video_url);
                      const isYouTube = /youtu\.?be/.test(raw) || raw.includes('youtube.com');
                      const isVimeo = raw.includes('vimeo.com');
                      const isDrive = raw.includes('drive.google.com') || raw.includes('docs.google.com');
                      const isVidalytics = raw.includes('vidalytics.com') || raw.includes('preview.vidalytics.com');

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
                          <p className="text-muted-foreground text-sm">Invalid Vidalytics URL</p>
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
                          <p className="text-muted-foreground text-sm">Invalid YouTube URL</p>
                        );
                      }

                      // For Vimeo and Google Drive, use iframe with security protections
                      let embedSrc: string | null = null;

                      if (isVimeo) {
                        embedSrc = getVimeoEmbedUrl(raw);
                      } else if (isDrive) {
                        let preview = raw
                          .replace(/\/view(\?.*)?$/, '/preview')
                          .replace(/\/download(\?.*)?$/, '/preview');
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
                            title={section.title || 'Video'}
                          />
                        </div>
                      ) : (
                        <video
                          src={raw}
                          controls
                          className="w-full h-full"
                          playsInline
                        />
                      );
                    })()
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No video available
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No video available
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'readout':
        return (
          <div className="space-y-2">
            {section.title && <h4 className="font-semibold">{section.title}</h4>}
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.data?.content_html || '') }}
            />
          </div>
        );
      case 'form':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold">{section.title}</h4>
            <p className="text-sm text-muted-foreground">
              This task includes a form with {task.formFields?.length || 0} fields
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>{task.title}</span>
            <Badge className="ml-2">{getStatusLabel(task.status)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="submission" disabled={!task.submission}>
              Submission
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">
                {task.description || 'No description available'}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Phase:</span>
                  <p className="font-medium">{task.phases?.title || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium capitalize">{task.task_type}</p>
                </div>
                {task.duration_minutes && (
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p className="font-medium">{task.duration_minutes} minutes</p>
                  </div>
                )}
                {task.points > 0 && (
                  <div>
                    <span className="text-muted-foreground">Points:</span>
                    <p className="font-medium">{task.points} pts</p>
                  </div>
                )}
                {task.dueInfo?.dueDate && (
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>
                    <p className="font-medium">{format(task.dueInfo.dueDate, 'MMM d, yyyy')}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Content Sections</h4>
              <TaskSectionPreview sections={task.sections || []} formFields={task.formFields || []} />
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            {task.sections && task.sections.length > 0 ? (
              task.sections.map((section: any, index: number) => (
                <div key={section.id || index} className="border-b pb-4 last:border-b-0">
                  {renderSectionContent(section)}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No content sections available</p>
            )}
          </TabsContent>

          <TabsContent value="submission" className="space-y-4">
            {task.submission ? (
              <div className="space-y-4">
                <div className="mb-4">
                  <span className="text-sm text-muted-foreground">Submitted on:</span>
                  <p className="font-medium">{format(new Date(task.submission.created_at), 'PPP')}</p>
                </div>
                <div className="space-y-3">
                  {Object.entries(task.submission.data || {}).map(([key, value]) => (
                    <div key={key} className="border-b border-border/50 pb-2 last:border-0">
                      <p className="text-sm font-medium capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-muted-foreground">{String(value)}</p>
                    </div>
                  ))}
                </div>
                {isCompleted && hasSubmission && (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/task-lesson/${task.id}?mode=edit`);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Submission
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No submission yet</p>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
