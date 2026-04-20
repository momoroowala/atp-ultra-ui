import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Check, CheckCircle2, AlertTriangle, FileText, Play, StickyNote, Loader2, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SprintTask, TaskStatus } from '@/hooks/useSprintData';
import { useNavigate } from 'react-router-dom';
import { useSprintTaskNotes } from '@/hooks/useSprintTaskNotes';

interface Props {
  task: SprintTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status?: TaskStatus;
  onToggle: (taskId: string) => void;
  getModuleLink: (moduleRef: string) => { courseId: string; phaseId: string } | null;
}

const shortModuleName = (name: string): string => {
  const m = name.match(/Module\s*\d+/i);
  return m ? m[0] : name.split('—')[0].trim();
};

const toEmbedUrl = (url: string): string => {
  if (url.includes('drive.google.com') && url.includes('/view')) {
    return url.replace('/view', '/preview');
  }
  if (/docs\.google\.com\/(document|spreadsheets|presentation)/.test(url)) {
    return url.replace(/\/edit.*$/, '/preview').replace(/\/view.*$/, '/preview');
  }
  return url;
};

export const SprintTaskDetailDrawer = ({ task, open, onOpenChange, status, onToggle, getModuleLink }: Props) => {
  const navigate = useNavigate();
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLabel, setViewerLabel] = useState('');
  const { content, updateContent, loading: notesLoading, saved } = useSprintTaskNotes(open && task ? task.id : null);

  if (!task) return null;

  const isCompleted = status === 'completed';
  const isPending = status === 'pending';

  const metrics = task.success_metrics?.split('\n').filter(Boolean) ?? [];
  const templates = (task.templates as Array<{ label: string; url: string }>) ?? [];
  const modules = task.modules ?? [];
  const moduleLinks = modules
    .map((mod) => ({ mod, link: getModuleLink(mod.module_name) }))
    .filter((m): m is { mod: typeof modules[0]; link: { courseId: string; phaseId: string } } => m.link !== null);
  const uniqueLinks = moduleLinks.filter(
    (m, i, arr) => arr.findIndex((x) => x.link.courseId === m.link.courseId && x.link.phaseId === m.link.phaseId) === i
  );

  const statusLabel = isCompleted ? 'Completed! ✅' : isPending ? 'Pending ⏳' : 'Mark as Pending';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto border-l border-primary/30">
          <SheetHeader className="pb-2">
            <div className="flex items-center gap-3">
              {task.is_checkpoint && (
                <span className="inline-flex items-center rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  🏁 Checkpoint
                </span>
              )}
              {task.is_final && (
                <span className="inline-flex items-center rounded-full bg-green-500/20 border border-green-500/40 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:text-green-400">
                  🎉 Final Day
                </span>
              )}
            </div>
            <SheetTitle className="text-lg font-bold text-foreground leading-snug mt-1">
              {task.title}
            </SheetTitle>
          </SheetHeader>

          {/* Status cycle toggle */}
          <button
            onClick={() => onToggle(task.id)}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl border px-4 py-3 mt-4 transition-all',
              isCompleted
                ? 'bg-primary/10 border-primary/40 text-primary'
                : isPending
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
                  : 'bg-muted/50 border-border text-muted-foreground hover:border-primary/40'
            )}
          >
            <div className={cn(
              'flex items-center justify-center h-6 w-6 rounded-full border-2 shrink-0 transition-colors',
              isCompleted
                ? 'bg-primary border-primary text-primary-foreground'
                : isPending
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'border-muted-foreground/40'
            )}>
              {isCompleted && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              {isPending && <Clock className="h-3.5 w-3.5" strokeWidth={3} />}
            </div>
            <span className="font-semibold text-sm">
              {statusLabel}
            </span>
          </button>

          <div className="space-y-5 mt-6">
            {/* Success Metrics */}
            {metrics.length > 0 && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Success Metrics</h3>
                </div>
                <div className="space-y-2">
                  {metrics.map((line, i) => {
                    const text = line.replace(/^[✓✔]\s*/, '');
                    return (
                      <div key={i} className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex items-center justify-center h-4.5 w-4.5 rounded-full bg-primary/20 shrink-0">
                          <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                        </div>
                        <span className="text-sm text-foreground/90 leading-snug">{text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Common Mistakes */}
            {task.common_mistakes && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h3 className="font-bold text-sm text-foreground">Common Mistakes</h3>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {task.common_mistakes}
                </p>
              </div>
            )}

            {/* Templates */}
            {templates.length > 0 && (
              <div className="rounded-xl border border-primary/30 bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-sm text-foreground">Templates & Resources</h3>
                </div>
                <div className="space-y-2">
                  {templates.map((tmpl, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setViewerLabel(tmpl.label);
                        setViewerUrl(toEmbedUrl(tmpl.url));
                      }}
                      className="w-full flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 hover:bg-primary/10 transition-colors group text-left"
                    >
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground flex-1">{tmpl.label}</span>
                      <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                        View
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Module Links */}
            {uniqueLinks
              .sort((a, b) => a.mod.module_name.localeCompare(b.mod.module_name, undefined, { numeric: true }))
              .length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">📚 Course Modules</h3>
                <div className="space-y-2">
                  {uniqueLinks
                    .sort((a, b) => a.mod.module_name.localeCompare(b.mod.module_name, undefined, { numeric: true }))
                    .map((m, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        navigate(`/courses/${m.link.courseId}?phaseId=${m.link.phaseId}`);
                        onOpenChange(false);
                      }}
                      className="w-full flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 hover:bg-primary/10 transition-colors group text-left"
                    >
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/15 shrink-0">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1 truncate">
                        {m.mod.module_name}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">My Notes</h3>
                {notesLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                {saved && (
                  <span className="text-[10px] font-medium text-primary/70 ml-auto">✓ Saved</span>
                )}
              </div>
              <Textarea
                placeholder="Write your notes here..."
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                className="min-h-[100px] text-sm bg-muted/30 border-border resize-y"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Document Viewer Dialog */}
      <Dialog open={!!viewerUrl} onOpenChange={(o) => { if (!o) setViewerUrl(null); }}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-4 py-3 border-b border-border shrink-0">
            <DialogTitle className="text-sm font-semibold truncate">{viewerLabel}</DialogTitle>
            <DialogDescription className="sr-only">Document preview</DialogDescription>
          </DialogHeader>
          {viewerUrl && (
            <iframe
              src={viewerUrl}
              className="w-full flex-1 border-0"
              title={viewerLabel}
              allow="autoplay"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
