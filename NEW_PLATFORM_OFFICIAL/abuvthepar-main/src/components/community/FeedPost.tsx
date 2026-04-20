import { memo, useState, useRef, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { SmilePlus, MessageSquare, MoreHorizontal, Pin, PinOff, Pencil, Trash2, Flag, Calendar, MapPin, Clock, Megaphone, Check, X, ExternalLink, Users, CheckCircle2, XCircle } from 'lucide-react';
import { useCallRsvps, useUpsertRsvp } from '@/hooks/useCallRsvp';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ReactionPicker } from './ReactionPicker';
import { useCommunityReactions } from '@/hooks/useCommunityReactions';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { UserProfilePopover } from '@/components/UserProfilePopover';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatMessageTime } from '@/utils/messageTimeFormatter';
import type { CommunityMessage } from '@/hooks/useCommunityMessages';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CommentSection } from './CommentSection';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const formatEventDate = (dateStr: string) => {
  try {
    const d = parseISO(dateStr);
    return format(d, 'EEEE, MMMM d, yyyy');
  } catch { return dateStr; }
};

const formatEventTime = (timeStr: string) => {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0);
    return format(d, 'h:mm a');
  } catch { return timeStr; }
};

const getLinkLabel = (url: string) => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('zoom')) return 'Join via Zoom';
    if (host.includes('meet.google')) return 'Join Google Meet';
    if (host.includes('teams.microsoft')) return 'Join Teams Meeting';
    return 'Join Meeting';
  } catch { return 'Open Link'; }
};

const EventMetaCard = ({ meta, onNavigateCalendar }: { meta: any; onNavigateCalendar: () => void }) => {
  const calendarCallId = meta.calendar_call_id;
  const { yesCount, currentUserRsvp } = useCallRsvps(calendarCallId);
  const { mutate: upsertRsvp } = useUpsertRsvp();

  const handleRsvp = (status: 'yes' | 'no') => {
    if (!calendarCallId) return;
    upsertRsvp({ callId: calendarCallId, status });
  };

  return (
    <div className="mb-3 rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800/40 bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 dark:from-emerald-950/30 dark:to-emerald-900/20">
      {/* Green accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-[#2D8F64] to-[#6EDAA6]" />
      
      <div className="p-4 space-y-3">
        {/* Date & Time row */}
        <div className="flex flex-wrap items-center gap-4">
          {meta.date && (
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{formatEventDate(meta.date)}</span>
            </div>
          )}
          {meta.time && (
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{formatEventTime(meta.time)}</span>
            </div>
          )}
        </div>

        {/* Location / Join link */}
        {meta.location && (
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <MapPin className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
            </div>
            {meta.location.startsWith('http') ? (
              <a
                href={meta.location}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline underline-offset-2 decoration-emerald-300 dark:decoration-emerald-700 hover:decoration-emerald-500 transition-colors"
              >
                {getLinkLabel(meta.location)}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span className="text-sm text-emerald-700 dark:text-emerald-400">{meta.location}</span>
            )}
          </div>
        )}

        {/* RSVP + Actions */}
        {calendarCallId && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/30">
            <Button
              size="sm"
              variant={currentUserRsvp === 'yes' ? 'default' : 'outline'}
              className={`gap-1.5 text-xs ${
                currentUserRsvp === 'yes'
                  ? 'bg-gradient-to-r from-[#2D8F64] to-[#55BD8A] text-white border-0 hover:from-[#267A56] hover:to-[#4AAF7E]'
                  : 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
              }`}
              onClick={() => handleRsvp('yes')}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Going
            </Button>
            <Button
              size="sm"
              variant={currentUserRsvp === 'no' ? 'default' : 'outline'}
              className={`gap-1.5 text-xs ${
                currentUserRsvp === 'no'
                  ? 'bg-muted text-foreground border-0'
                  : 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
              }`}
              onClick={() => handleRsvp('no')}
            >
              <XCircle className="h-3.5 w-3.5" />
              Not Going
            </Button>
            {yesCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-500 ml-1">
                <Users className="h-3.5 w-3.5" />
                {yesCount} attending
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="ml-auto text-xs gap-1.5 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              onClick={onNavigateCalendar}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View in Calendar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};


interface FeedPostProps {
  message: CommunityMessage & { post_type?: string };
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, content: string) => void;
  channelId?: string;
  isReadOnly?: boolean;
  showChannelBadge?: boolean;
  channelName?: string;
  channelEmoji?: string;
}

const FeedPostInner = ({ message, onPin, onUnpin, onDelete, onEdit, channelId, isReadOnly, showChannelBadge, channelName, channelEmoji }: FeedPostProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isCSM, isExecutive } = useRoleCheck();
  const isStaff = isAdmin || isCSM || isExecutive;
  const { toggleReaction } = useCommunityReactions();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const reactionBtnRef = useRef<HTMLButtonElement>(null);

  const canEdit = user?.id === message.sender_id;
  const canDelete = user?.id === message.sender_id || isStaff;
  const canPin = isStaff;
  const postType = (message as any).post_type || 'text';

  const sender = message.sender;
  const fullName = sender ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim() : '';
  const name = fullName || sender?.user_email || 'Unknown User';
  const initials = fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : name.slice(0, 2).toUpperCase();
  const timestamp = message.created_at ? formatMessageTime(message.created_at) : '';

  // Parse attachments
  const rawAttachments = message.attachments;
  const allAttachments: { url: string; type: string; name: string }[] =
    Array.isArray(rawAttachments) ? rawAttachments :
    typeof rawAttachments === 'string' ? (() => { try { return JSON.parse(rawAttachments); } catch { return []; } })() : [];
  
  const mediaAttachments = allAttachments.filter(a => a.type !== 'event_meta');
  const eventMeta = allAttachments.find(a => a.type === 'event_meta');
  const parsedEventMeta = eventMeta ? (() => { try { return JSON.parse(eventMeta.name); } catch { return null; } })() : null;

  const images = mediaAttachments.filter(a => a.type === 'image' || a.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(a.name));
  const videos = mediaAttachments.filter(a => a.type?.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(a.name));
  const files = mediaAttachments.filter(a => !images.includes(a) && !videos.includes(a));

  // Reaction user names
  const reactionUserIds = useMemo(() => {
    if (!message.reactions?.length) return [];
    const ids = new Set<string>();
    message.reactions.forEach(r => r.users.forEach(id => ids.add(id)));
    return Array.from(ids);
  }, [message.reactions]);

  const { data: reactionUserNames } = useQuery({
    queryKey: ['reaction-user-names', reactionUserIds.sort().join(',')],
    queryFn: async () => {
      if (reactionUserIds.length === 0) return new Map<string, string>();
      const { data } = await supabase.from('user_profiles').select('id, first_name, last_name').in('id', reactionUserIds);
      const map = new Map<string, string>();
      data?.forEach(u => map.set(u.id, `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown'));
      return map;
    },
    enabled: reactionUserIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const handleReaction = (emoji: string) => {
    toggleReaction.mutate({ messageId: message.id, emoji });
    setShowReactionPicker(false);
  };

  const handleEditSave = () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === message.content) { setIsEditing(false); setEditContent(message.content); return; }
    onEdit?.(message.id, trimmed);
    setIsEditing(false);
  };

  return (
    <>
      <div className={`bg-card border border-border rounded-xl shadow-sm overflow-hidden ${message.is_pinned ? 'ring-1 ring-primary/30' : ''}`}>
        {/* Pinned indicator */}
        {message.is_pinned && (
          <div className="flex items-center gap-1.5 px-4 pt-3 text-xs text-primary font-medium">
            <Pin className="h-3 w-3" />
            Pinned Post
          </div>
        )}

        {/* Post type badge */}
        {postType === 'announcement' && (
          <div className="flex items-center gap-1.5 px-4 pt-3 text-xs text-amber-600 font-medium">
            <Megaphone className="h-3 w-3" />
            Announcement
          </div>
        )}
        {postType === 'event' && (
          <div className="flex items-center gap-1.5 px-4 pt-3 text-xs text-emerald-600 font-medium">
            <Calendar className="h-3 w-3" />
            Event
          </div>
        )}

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <UserProfilePopover userId={message.sender_id}>
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarImage src={sender?.avatar_url || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </UserProfilePopover>
              <div>
                <UserProfilePopover userId={message.sender_id}>
                  <span className="font-semibold text-sm text-foreground hover:underline cursor-pointer">{name}</span>
                </UserProfilePopover>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{timestamp}</span>
                  {message.is_edited && <span className="text-xs text-muted-foreground italic">· edited</span>}
                  {showChannelBadge && channelName && (
                    <span className="inline-flex items-center gap-1 text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                      <span className="text-[10px]">{channelEmoji || '💬'}</span>
                      {channelName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canPin && (
                  message.is_pinned ? (
                    <DropdownMenuItem onClick={() => onUnpin?.(message.id)}>
                      <PinOff className="h-4 w-4 mr-2" /> Unpin
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onPin?.(message.id)}>
                      <Pin className="h-4 w-4 mr-2" /> Pin
                    </DropdownMenuItem>
                  )
                )}
                {canEdit && (
                  <DropdownMenuItem onClick={() => { setIsEditing(true); setEditContent(message.content); }}>
                    <Pencil className="h-4 w-4 mr-2" /> Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete post?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete?.(message.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mb-3">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(); } if (e.key === 'Escape') { setIsEditing(false); setEditContent(message.content); } }}
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary resize-none min-h-[60px]"
                autoFocus
              />
              <div className="flex gap-2 mt-1 justify-end">
                <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditContent(message.content); }}><X className="h-3 w-3 mr-1" /> Cancel</Button>
                <Button size="sm" onClick={handleEditSave}><Check className="h-3 w-3 mr-1" /> Save</Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none break-words whitespace-pre-wrap mb-3">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}

          {/* Event meta */}
          {postType === 'event' && parsedEventMeta && (
            <EventMetaCard
              meta={parsedEventMeta}
              onNavigateCalendar={() => navigate('/calendar')}
            />
          )}

          {/* Photo grid */}
          {images.length > 0 && (
            <div className={`mb-3 grid gap-1 rounded-lg overflow-hidden ${
              images.length === 1 ? 'grid-cols-1' :
              images.length === 2 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {images.slice(0, 4).map((img, i) => (
                <div key={i} className={`relative ${images.length === 1 ? 'max-h-[400px]' : images.length === 3 && i === 0 ? 'row-span-2' : 'max-h-[200px]'}`}>
                  <img
                    src={img.url}
                    alt={img.name}
                    loading="lazy"
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setLightboxImage(img.url)}
                  />
                  {i === 3 && images.length > 4 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">+{images.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Videos */}
          {videos.map((vid, i) => (
            <div key={i} className="mb-3">
              <video src={vid.url} controls className="w-full max-h-[400px] rounded-lg bg-black" preload="metadata" />
            </div>
          ))}

          {/* File attachments */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {files.map((f, i) => (
                <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 text-sm">
                  {f.name}
                </a>
              ))}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <TooltipProvider delayDuration={300}>
              <div className="flex flex-wrap gap-1 mb-3">
                {message.reactions.map(reaction => {
                  const hasReacted = reaction.users.includes(user?.id || '');
                  const names = reaction.users.map(id => reactionUserNames?.get(id) || null).filter(Boolean) as string[];
                  const tooltipText = names.length > 3 ? `${names.slice(0, 3).join(', ')}, +${names.length - 3}` : names.join(', ');
                  return (
                    <Tooltip key={reaction.emoji}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleReaction(reaction.emoji)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border transition-colors ${hasReacted ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted border-border hover:border-primary/30'}`}
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-xs font-medium">{reaction.count}</span>
                        </button>
                      </TooltipTrigger>
                      {tooltipText && <TooltipContent side="top"><p className="text-xs">{tooltipText}</p></TooltipContent>}
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-1 border-t border-border pt-2">
            <div className="relative">
              <Button
                ref={reactionBtnRef}
                variant="ghost"
                size="sm"
                className="text-muted-foreground gap-1.5 text-xs"
                onClick={() => setShowReactionPicker(!showReactionPicker)}
              >
                <SmilePlus className="h-4 w-4" />
                React
              </Button>
              {showReactionPicker && (
                <ReactionPicker
                  onSelect={handleReaction}
                  onClose={() => setShowReactionPicker(false)}
                  triggerRect={reactionBtnRef.current?.getBoundingClientRect() ?? null}
                />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-1.5 text-xs"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageSquare className="h-4 w-4" />
              Comment{message.reply_count ? ` (${message.reply_count})` : ''}
            </Button>
          </div>
        </div>

        {/* Comment section */}
        {showComments && (
          <CommentSection
            postId={message.id}
            channelId={channelId}
            isReadOnly={isReadOnly}
          />
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-0 bg-transparent border-none">
          {lightboxImage && (
            <img src={lightboxImage} alt="Post image" className="w-full h-auto max-h-[90vh] object-contain rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export const FeedPost = memo(FeedPostInner);
