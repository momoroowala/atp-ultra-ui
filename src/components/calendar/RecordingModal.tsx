import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CallRecording } from '@/hooks/useCallRecordings';
import { formatDateLabel } from '@/utils/dateHelpers';
import { Edit, Trash2, ExternalLink, Brain, CheckSquare, FileText, Lightbulb } from 'lucide-react';
import { TierBadges } from './TierBadge';
import { VidalyticsPlayer } from '@/components/learning/VidalyticsPlayer';
import { getVimeoEmbedUrl } from '@/utils/videoEmbedHelpers';
import { useFathomNotes } from '@/hooks/useFathomNotes';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useState, useEffect } from 'react';

interface RecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recording: CallRecording | null;
  isAdmin: boolean;
  onEdit: (recording: CallRecording) => void;
  onDelete: (id: string) => void;
}

/** Parse markdown-ish text into simple formatted blocks */
const renderMarkdownText = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;
    
    // Bold headers like **Something**
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      return <p key={i} className="font-semibold text-foreground mt-3 first:mt-0">{trimmed.replace(/\*\*/g, '')}</p>;
    }
    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      return (
        <li key={i} className="text-sm text-muted-foreground ml-4 list-disc">
          {trimmed.substring(2).replace(/\*\*/g, '')}
        </li>
      );
    }
    // Regular text (strip inline bold markers)
    return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{trimmed.replace(/\*\*/g, '')}</p>;
  });
};

/** Extract key takeaways from summary text */
const extractKeyTakeaways = (summary: string): string[] => {
  const takeaways: string[] = [];
  const lines = summary.split('\n');
  let inTakeawaysSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    
    if (lower.includes('key takeaway') || lower.includes('key point') || lower.includes('highlight') || lower.includes('main topic')) {
      inTakeawaysSection = true;
      continue;
    }
    
    if (inTakeawaysSection) {
      if (trimmed.startsWith('**') && !trimmed.startsWith('- ') && !trimmed.startsWith('• ')) {
        inTakeawaysSection = false;
        continue;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        takeaways.push(trimmed.substring(2).replace(/\*\*/g, ''));
      }
    }
  }
  return takeaways;
};

export const RecordingModal = ({ 
  open, 
  onOpenChange, 
  recording, 
  isAdmin, 
  onEdit, 
  onDelete 
}: RecordingModalProps) => {
  const { data: fathomNote } = useFathomNotes(recording?.id);
  const [activeTab, setActiveTab] = useState<'video' | 'notes'>('video');

  // Default to notes tab when fathom data exists
  useEffect(() => {
    if (open && fathomNote) {
      setActiveTab('notes');
    } else if (open) {
      setActiveTab('video');
    }
  }, [open, fathomNote]);

  if (!recording) return null;

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(recording);
  };

  const handleDelete = () => {
    onOpenChange(false);
    onDelete(recording.id);
  };

  const isEmbeddable = (url: string) => {
    return url.includes('vimeo.com') || url.includes('youtube.com') || url.includes('youtu.be') || 
           url.includes('vidalytics.com') || url.includes('preview.vidalytics.com');
  };

  const isVidalytics = (url: string) => {
    return url.includes('vidalytics.com') || url.includes('preview.vidalytics.com');
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('vimeo.com')) {
      return getVimeoEmbedUrl(url);
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('/').pop() 
        : new URL(url).searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  const actionItems = fathomNote?.action_items as Array<{ text: string; assignee?: any }> | null;
  const transcript = fathomNote?.transcript as Array<{ speaker: string; text: string; timestamp?: string }> | null;
  const keyTakeaways = fathomNote?.summary ? extractKeyTakeaways(fathomNote.summary) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-2xl">{recording.title}</DialogTitle>
            {fathomNote && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 gap-1">
                <Brain className="h-3 w-3" />
                AI Notes
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{formatDateLabel(recording.recorded_date)}</span>
            {recording.duration_minutes && <span>• {recording.duration_minutes} minutes</span>}
          </div>
        </DialogHeader>
        
        {/* Tab switcher when Fathom notes exist */}
        {fathomNote && (
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'notes' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Brain className="h-3.5 w-3.5 inline mr-1.5" />
              Meeting Notes
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'video' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Recording
            </button>
          </div>
        )}

        <div className="space-y-6">
          {activeTab === 'video' && (
            <>
              {/* Video Player */}
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {isVidalytics(recording.recording_url) ? (
                  (() => {
                    const vidMatch = recording.recording_url.match(/vidalytics\.com\/vid\/([^?&#/]+)/) || 
                                   recording.recording_url.match(/vidalytics_embed_([^?&#/\s]+)/);
                    const videoId = vidMatch ? vidMatch[1] : null;
                    
                    return videoId ? (
                      <VidalyticsPlayer videoId={videoId} title={recording.title} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                        <p className="text-muted-foreground">Invalid Vidalytics URL</p>
                      </div>
                    );
                  })()
                ) : isEmbeddable(recording.recording_url) ? (
                  <div className="iframe-wrapper">
                    <iframe
                      src={getEmbedUrl(recording.recording_url)}
                      className="w-full h-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                    <p className="text-muted-foreground">Video player not available for this format</p>
                    <Button onClick={() => window.open(recording.recording_url, '_blank')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in New Tab
                    </Button>
                  </div>
                )}
              </div>

              {/* Description */}
              {recording.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{recording.description}</p>
                </div>
              )}

              {/* Tags */}
              {recording.tags && recording.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {recording.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Links */}
              {recording.additional_links && (recording.additional_links as any).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Additional Resources</h4>
                  <div className="space-y-2">
                    {(recording.additional_links as any).map((link: any, index: number) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {link.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tier Visibility */}
              {recording.visible_tiers && recording.visible_tiers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Visible to</h4>
                  <TierBadges tiers={recording.visible_tiers} />
                </div>
              )}
            </>
          )}

          {activeTab === 'notes' && fathomNote && (
            <div className="space-y-5">
              {/* AI Summary */}
              {fathomNote.summary && (
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <h4 className="font-semibold">Summary</h4>
                  </div>
                  <div className="space-y-0.5">
                    {renderMarkdownText(fathomNote.summary)}
                  </div>
                </div>
              )}

              {/* Key Takeaways (extracted from summary) */}
              {keyTakeaways.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800/50 dark:bg-amber-950/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <h4 className="font-semibold">Key Takeaways</h4>
                  </div>
                  <ul className="space-y-2">
                    {keyTakeaways.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-amber-600 mt-0.5 flex-shrink-0">💡</span>
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {actionItems && actionItems.length > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50/50 dark:border-green-800/50 dark:bg-green-950/20 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <h4 className="font-semibold">Action Items</h4>
                    <Badge variant="secondary" className="text-xs">{actionItems.length}</Badge>
                  </div>
                  <ul className="space-y-2">
                    {actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-4 h-4 mt-0.5 rounded border border-green-400 dark:border-green-600 flex-shrink-0" />
                        <span className="text-muted-foreground">
                          {typeof item === 'string' ? item : (typeof item.text === 'string' ? item.text : JSON.stringify(item.text))}
                          {item.assignee && (
                             <span className="ml-1 text-xs text-primary font-medium">
                               @{typeof item.assignee === 'object' ? (item.assignee.display_name || 'Unknown') : String(item.assignee)}
                             </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Transcript (collapsed) */}
              {transcript && transcript.length > 0 && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="transcript" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold">Full Transcript</span>
                        <Badge variant="secondary" className="text-xs">{transcript.length} entries</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {transcript.map((entry, i) => (
                          <div key={i} className="text-sm">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium text-foreground">{typeof entry.speaker === 'object' && entry.speaker !== null ? (entry.speaker as any).display_name || 'Speaker' : String(entry.speaker)}</span>
                              {entry.timestamp && (
                                <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                              )}
                            </div>
                            <p className="text-muted-foreground pl-2 border-l-2 border-muted">
                              {entry.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Link to Fathom */}
              {fathomNote.fathom_meeting_url && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(fathomNote.fathom_meeting_url!, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View in Fathom
                </Button>
              )}
            </div>
          )}

          {/* Admin Actions */}
          {isAdmin && (
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleEdit} className="flex-1">
                <Edit className="mr-2 h-4 w-4" />
                Edit Recording
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="flex-1">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Recording
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
