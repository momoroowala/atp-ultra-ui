import { useState, useRef, useMemo, memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SmilePlus, MessageSquare, Trash2, Flag, AlertTriangle, Pin, PinOff, Pencil, Check, X } from 'lucide-react';
import { ReactionPicker } from './ReactionPicker';
import { useCommunityReactions } from '@/hooks/useCommunityReactions';
import { useChatModeration } from '@/hooks/useChatModeration';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { UserProfilePopover } from '@/components/UserProfilePopover';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatMessageTime, formatShortTime } from '@/utils/messageTimeFormatter';
import type { CommunityMessage } from '@/hooks/useCommunityMessages';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MessageItemProps {
  message: CommunityMessage & { is_hidden?: boolean; is_flagged?: boolean; is_pinned?: boolean; shared_from_thread_id?: string | null };
  isConsecutive?: boolean;
  onReply?: () => void;
  isReply?: boolean;
  onPin?: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, content: string) => void;
  isDM?: boolean;
  isReadOnly?: boolean;
}

export const MessageItem = memo(({ message, isConsecutive, onReply, isReply = false, onPin, onUnpin, onDeleteMessage, onEditMessage, isDM = false, isReadOnly = false }: MessageItemProps) => {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { toggleReaction } = useCommunityReactions();
  const { flagMessage } = useChatModeration();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const reactionBtnRef = useRef<HTMLButtonElement>(null);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Collect all unique user IDs from reactions for name resolution
  const reactionUserIds = useMemo(() => {
    if (!message.reactions?.length) return [];
    const ids = new Set<string>();
    message.reactions.forEach(r => r.users.forEach((id: string) => ids.add(id)));
    return Array.from(ids);
  }, [message.reactions]);

  const { data: reactionUserNames } = useQuery({
    queryKey: ['reaction-user-names', reactionUserIds.sort().join(',')],
    queryFn: async () => {
      if (reactionUserIds.length === 0) return new Map<string, string>();
      const { data } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('id', reactionUserIds);
      const map = new Map<string, string>();
      data?.forEach(u => {
        const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown';
        map.set(u.id, name);
      });
      return map;
    },
    enabled: reactionUserIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
  
  const canDelete = user?.id === message.sender_id || isAdmin;
  const canEdit = user?.id === message.sender_id && !!onEditMessage;

  const handleStartEdit = () => {
    setEditContent(message.content);
    setIsEditing(true);
    // Focus textarea after render
    setTimeout(() => editTextareaRef.current?.focus(), 0);
  };

  const handleSaveEdit = () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === message.content) {
      setIsEditing(false);
      return;
    }
    onEditMessage?.(message.id, trimmed);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const sender = message.sender;
  const fullName = sender 
    ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim()
    : '';
  const name = fullName || sender?.user_email || 'Unknown User';
  const initials = fullName 
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : name.slice(0, 2).toUpperCase();
  const timestamp = message.created_at ? formatMessageTime(message.created_at) : '';
  const shortTime = message.created_at ? formatShortTime(message.created_at) : '';

  const handleReaction = (emoji: string) => {
    toggleReaction.mutate({ messageId: message.id, emoji });
    setShowReactionPicker(false);
  };

  // Parse attachments - handle various formats (array, JSON string, or object)
  const rawAttachments = message.attachments;
  const attachments: { url: string; type: string; name: string }[] = 
    Array.isArray(rawAttachments) 
      ? rawAttachments 
      : typeof rawAttachments === 'string' 
        ? (() => { try { return JSON.parse(rawAttachments); } catch { return []; } })()
        : [];

  const replyCount = message.reply_count || 0;
  const isHiddenForUser = message.is_hidden && message.sender_id === user?.id;
  const canFlag = !isAdmin && message.sender_id !== user?.id && !message.is_flagged;
  const canPin = isAdmin || isDM;

  const handleFlagMessage = () => {
    if (!flagReason.trim()) return;
    flagMessage.mutate({ messageId: message.id, reason: flagReason });
    setShowFlagDialog(false);
    setFlagReason('');
  };

  return (
    <div className={isReply ? '' : ''}>
      {/* Hidden Message Warning */}
      {isHiddenForUser && (
        <div className="flex items-center gap-2 mx-2 mt-4 mb-1 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span className="text-xs text-amber-600">This message is under review and only visible to you</span>
        </div>
      )}

      <div className={`group relative flex gap-3 px-2 py-1 hover:bg-muted/50 rounded-lg ${isConsecutive && !isHiddenForUser ? 'mt-0' : isHiddenForUser ? 'mt-1' : 'mt-4'} ${isReply ? 'ml-8 border-l-2 border-muted pl-4' : ''} ${isHiddenForUser ? 'opacity-70' : ''}`}>
        {/* Avatar or Spacer */}
        {isConsecutive ? (
          <div className="w-10 flex-shrink-0 flex items-center justify-center">
            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              {shortTime}
            </span>
          </div>
        ) : (
          <UserProfilePopover userId={message.sender_id}>
            <Avatar className={`flex-shrink-0 ${isReply ? 'h-8 w-8' : 'h-10 w-10'}`}>
              <AvatarImage src={sender?.avatar_url || undefined} />
              <AvatarFallback className={isReply ? 'text-xs' : ''}>{initials}</AvatarFallback>
            </Avatar>
          </UserProfilePopover>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {!isConsecutive && (
            <div className="flex items-baseline gap-2 mb-1">
              <UserProfilePopover userId={message.sender_id}>
                <span className={`font-semibold text-foreground ${isReply ? 'text-sm' : ''} hover:underline`}>{name}</span>
              </UserProfilePopover>
              <span className="text-xs text-muted-foreground">{timestamp}</span>
              {message.is_edited && (
                <span className="text-[11px] text-muted-foreground">(edited)</span>
              )}
              {message.is_pinned && (
                <Pin className="h-3 w-3 text-primary" />
              )}
            </div>
          )}

          {/* Message Content with Markdown and styled mentions */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                ref={editTextareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="w-full min-h-[60px] max-h-[200px] p-2 text-sm bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ overflowY: 'auto' }}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" variant="default" className="h-7 px-2 text-xs" onClick={handleSaveEdit}>
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={handleCancelEdit}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <span className="text-[11px] text-muted-foreground">Escape to cancel, Enter to save</span>
              </div>
            </div>
          ) : (
            <div className={`prose prose-sm dark:prose-invert max-w-none break-words ${isReply ? 'text-sm' : ''}`}>
              {message.content.includes('@') ? (
                <p>
                  {/* Match @Name or @FirstName LastName (1-2 capitalized words after @) */}
                  {message.content.split(/(@[A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*)?)/g).map((part, index) => {
                    if (part.match(/^@[A-Z][a-zA-Z]*(?:\s[A-Z][a-zA-Z]*)?$/)) {
                      return (
                        <span key={index} className="font-bold text-primary">
                          {part}
                        </span>
                      );
                    }
                    return <span key={index}>{part}</span>;
                  })}
                </p>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {attachments.map((attachment, index) => {
                // Check if it's an image by type or by file extension
                const isImage = attachment.type === 'image' || 
                  attachment.type?.startsWith('image/') ||
                  /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(attachment.name);
                
                return (
                  <div key={index}>
                    {isImage ? (
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="max-w-xs max-h-64 rounded-lg border border-border cursor-pointer hover:opacity-90"
                        onClick={() => window.open(attachment.url, '_blank')}
                      />
                    ) : (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80"
                      >
                        <span className="text-sm truncate max-w-[200px]">{attachment.name}</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <TooltipProvider delayDuration={300}>
              <div className="flex flex-wrap gap-1 mt-2">
                {message.reactions.map((reaction) => {
                  const hasReacted = reaction.users.includes(user?.id || '');
                  const names = reaction.users
                    .map((id: string) => reactionUserNames?.get(id) || null)
                    .filter(Boolean) as string[];
                  const tooltipText = names.length > 3
                    ? `${names.slice(0, 3).join(', ')}, and ${names.length - 3} other${names.length - 3 > 1 ? 's' : ''}`
                    : names.join(', ');
                  return (
                    <Tooltip key={reaction.emoji}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleReaction(reaction.emoji)}
                          className={`
                            inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm
                            border transition-colors min-h-[32px]
                            ${hasReacted 
                              ? 'bg-primary/10 border-primary/30 text-primary' 
                              : 'bg-muted border-border hover:border-primary/30'
                            }
                          `}
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-xs font-medium">{reaction.count}</span>
                        </button>
                      </TooltipTrigger>
                      {tooltipText && (
                        <TooltipContent side="top" className="max-w-[200px] text-center">
                          <p className="text-xs">{reaction.emoji} {tooltipText}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          )}

          {/* Shared from thread indicator */}
          {message.shared_from_thread_id && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>Replied in thread</span>
            </div>
          )}

          {/* Reply count - opens thread drawer */}
          {!isReply && replyCount > 0 && (
            <button
              onClick={onReply}
              className="mt-2 flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
            </button>
          )}
        </div>

        {/* Hover Actions */}
        <div className="absolute right-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-card border border-border rounded-lg shadow-sm p-1">
          <div className="relative">
            <Button
              ref={reactionBtnRef}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowReactionPicker(!showReactionPicker)}
            >
              <SmilePlus className="h-4 w-4" />
            </Button>
            {showReactionPicker && (
              <ReactionPicker
                onSelect={handleReaction}
                onClose={() => setShowReactionPicker(false)}
                triggerRect={reactionBtnRef.current?.getBoundingClientRect() ?? null}
              />
            )}
          </div>
          {onReply && !isReply && !isReadOnly && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onReply}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
          {canEdit && !isReadOnly && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleStartEdit}
              title="Edit message"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canPin && !isReply && (
            message.is_pinned ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary hover:text-primary/80"
                onClick={() => onUnpin?.(message.id)}
                title="Unpin message"
              >
                <PinOff className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPin?.(message.id)}
                title="Pin message"
              >
                <Pin className="h-4 w-4" />
              </Button>
            )
          )}
          {canFlag && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
              onClick={() => setShowFlagDialog(true)}
            >
              <Flag className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The message will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDeleteMessage?.(message.id)}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Flag Message Dialog */}
        <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Message</DialogTitle>
              <DialogDescription>
                Please provide a reason for reporting this message. An admin will review it.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Why are you reporting this message?"
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFlagDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleFlagMessage}
                disabled={!flagReason.trim() || flagMessage.isPending}
                className="bg-amber-500 hover:bg-amber-600"
              >
                Report Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

    </div>
  );
});
