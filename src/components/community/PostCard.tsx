import { useState, useRef, useMemo, memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Heart,
  MessageCircle,
  Share2,
  SmilePlus,
  MoreHorizontal,
  Trash2,
  Flag,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { ReactionPicker } from './ReactionPicker';
import { useCommunityReactions } from '@/hooks/useCommunityReactions';
import { useThreadReplies, useCommunityMessages } from '@/hooks/useCommunityMessages';
import type { CommunityMessage, SendMessageInput } from '@/hooks/useCommunityMessages';
import { useChatModeration } from '@/hooks/useChatModeration';
import { useAuth } from '@/hooks/useAuth';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { UserProfilePopover } from '@/components/UserProfilePopover';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PostCardProps {
  message: CommunityMessage;
  channelId?: string;
  onDeleteMessage?: (id: string) => void;
  onEditMessage?: (id: string, content: string) => void;
  isReadOnly?: boolean;
  sendMessage: { mutate: (input: SendMessageInput) => void };
}

export const PostCard = memo(({
  message,
  channelId,
  onDeleteMessage,
  onEditMessage,
  isReadOnly,
  sendMessage,
}: PostCardProps) => {
  const { user } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { toggleReaction } = useCommunityReactions();
  const { flagMessage } = useChatModeration();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const reactionBtnRef = useRef<HTMLButtonElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { replies, isLoading: repliesLoading } = useThreadReplies(
    showComments ? message.id : undefined
  );

  const canDelete = user?.id === message.sender_id || isAdmin;
  const canEdit = user?.id === message.sender_id && !!onEditMessage;
  const canFlag = !isAdmin && message.sender_id !== user?.id && !message.is_flagged;
  const isHiddenForUser = message.is_hidden && message.sender_id === user?.id;

  // Sender info
  const sender = message.sender;
  const fullName = sender
    ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim()
    : '';
  const name = fullName || sender?.user_email || 'Unknown User';
  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : name.slice(0, 2).toUpperCase();

  const timeAgo = message.created_at
    ? formatDistanceToNowStrict(new Date(message.created_at), { addSuffix: true })
    : '';

  // Parse attachments
  const rawAttachments = message.attachments;
  const attachments: { url: string; type: string; name: string }[] =
    Array.isArray(rawAttachments)
      ? rawAttachments
      : typeof rawAttachments === 'string'
        ? (() => { try { return JSON.parse(rawAttachments); } catch { return []; } })()
        : [];

  const imageAttachments = attachments.filter(a =>
    a.type === 'image' || a.type?.startsWith('image/') ||
    /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(a.name)
  );
  const fileAttachments = attachments.filter(a =>
    a.type !== 'image' && !a.type?.startsWith('image/') &&
    !/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(a.name)
  );

  // Reaction helpers
  const totalReactions = useMemo(() => {
    return (message.reactions || []).reduce((sum, r) => sum + r.count, 0);
  }, [message.reactions]);

  const userHasLiked = useMemo(() => {
    return (message.reactions || []).some(
      r => r.emoji === '\u2764\uFE0F' && r.users.includes(user?.id || '')
    );
  }, [message.reactions, user?.id]);

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
        const uName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown';
        map.set(u.id, uName);
      });
      return map;
    },
    enabled: reactionUserIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const replyCount = message.reply_count || 0;

  const handleReaction = (emoji: string) => {
    toggleReaction.mutate({ messageId: message.id, emoji });
    setShowReactionPicker(false);
  };

  const handleLike = () => {
    toggleReaction.mutate({ messageId: message.id, emoji: '\u2764\uFE0F' });
  };

  const handlePostComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    sendMessage.mutate({
      content: trimmed,
      channel_id: channelId,
      parent_message_id: message.id,
    });
    setCommentText('');
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePostComment();
    }
  };

  const handleStartEdit = () => {
    setEditContent(message.content);
    setIsEditing(true);
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

  const handleFlagMessage = () => {
    if (!flagReason.trim()) return;
    flagMessage.mutate({ messageId: message.id, reason: flagReason });
    setShowFlagDialog(false);
    setFlagReason('');
  };

  return (
    <Card className={cn(
      'overflow-hidden transition-shadow hover:shadow-md',
      isHiddenForUser && 'opacity-70 border-amber-500/30'
    )}>
      {/* Hidden warning */}
      {isHiddenForUser && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/30">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span className="text-xs text-amber-600 dark:text-amber-400">This post is under review and only visible to you</span>
        </div>
      )}

      {/* Author Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <UserProfilePopover userId={message.sender_id}>
          <Avatar className="h-10 w-10 cursor-pointer">
            <AvatarImage src={sender?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </UserProfilePopover>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <UserProfilePopover userId={message.sender_id}>
              <span className="font-semibold text-sm text-foreground hover:underline cursor-pointer">
                {name}
              </span>
            </UserProfilePopover>
            {message.is_edited && (
              <span className="text-[11px] text-muted-foreground">(edited)</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        {/* Actions dropdown */}
        {(canEdit || canDelete || canFlag) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && !isReadOnly && (
                <DropdownMenuItem onClick={handleStartEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Post
                </DropdownMenuItem>
              )}
              {canFlag && (
                <DropdownMenuItem onClick={() => setShowFlagDialog(true)}>
                  <Flag className="h-4 w-4 mr-2" />
                  Report Post
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {}}>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <div className="flex items-center w-full">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Post
                      </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The post will be permanently removed.
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
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={editTextareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="w-full min-h-[80px] max-h-[300px] p-3 text-sm bg-background border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              style={{ overflowY: 'auto' }}
            />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="default" className="h-7 px-3 text-xs" onClick={handleSaveEdit}>
                <Check className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-3 text-xs" onClick={handleCancelEdit}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <span className="text-[11px] text-muted-foreground">Escape to cancel, Enter to save</span>
            </div>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            {message.content.includes('@') ? (
              <p>
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
      </div>

      {/* Image Attachments */}
      {imageAttachments.length > 0 && (
        <div className={cn(
          'px-4 pb-3',
          imageAttachments.length === 1 ? '' : 'grid grid-cols-2 gap-2'
        )}>
          {imageAttachments.map((attachment, index) => (
            <img
              key={index}
              src={attachment.url}
              alt={attachment.name}
              className={cn(
                'rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity object-cover',
                imageAttachments.length === 1 ? 'w-full max-h-[400px]' : 'w-full h-48'
              )}
              onClick={() => window.open(attachment.url, '_blank')}
            />
          ))}
        </div>
      )}

      {/* File Attachments */}
      {fileAttachments.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {fileAttachments.map((attachment, index) => (
            <a
              key={index}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80 text-sm"
            >
              <span className="truncate max-w-[200px]">{attachment.name}</span>
            </a>
          ))}
        </div>
      )}

      {/* Reactions display */}
      {message.reactions && message.reactions.length > 0 && (
        <TooltipProvider delayDuration={300}>
          <div className="flex flex-wrap gap-1.5 px-4 pb-3">
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
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-colors',
                        hasReacted
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted border-border hover:border-primary/30'
                      )}
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

      {/* Stats bar */}
      {(totalReactions > 0 || replyCount > 0) && (
        <div className="flex items-center justify-between px-4 pb-2 text-xs text-muted-foreground">
          {totalReactions > 0 ? (
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
              {totalReactions}
            </span>
          ) : <span />}
          {replyCount > 0 && (
            <button
              onClick={() => setShowComments(prev => !prev)}
              className="hover:underline"
            >
              {replyCount} {replyCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center border-t border-border/50 mx-4">
        <button
          onClick={handleLike}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50 rounded-md',
            userHasLiked ? 'text-rose-500' : 'text-muted-foreground'
          )}
        >
          <Heart className={cn('h-4 w-4', userHasLiked && 'fill-current')} />
          Like
        </button>

        <button
          onClick={() => setShowComments(prev => !prev)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 rounded-md"
        >
          <MessageCircle className="h-4 w-4" />
          Comment
        </button>

        <div className="relative flex-1">
          <button
            ref={reactionBtnRef}
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 rounded-md"
          >
            <SmilePlus className="h-4 w-4" />
            React
          </button>
          {showReactionPicker && (
            <ReactionPicker
              onSelect={handleReaction}
              onClose={() => setShowReactionPicker(false)}
              triggerRect={reactionBtnRef.current?.getBoundingClientRect() ?? null}
            />
          )}
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-border/50 bg-muted/20">
          {/* Existing comments */}
          <div className="px-4 py-3 space-y-3 max-h-[400px] overflow-y-auto">
            {repliesLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="h-7 w-7 rounded-full bg-muted animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-full bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : replies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No comments yet. Be the first to comment!</p>
            ) : (
              replies.map((reply) => {
                const replySender = reply.sender;
                const replyFullName = replySender
                  ? `${replySender.first_name || ''} ${replySender.last_name || ''}`.trim()
                  : '';
                const replyName = replyFullName || replySender?.user_email || 'Unknown';
                const replyInitials = replyFullName
                  ? replyFullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  : replyName.slice(0, 2).toUpperCase();
                const replyTimeAgo = reply.created_at
                  ? formatDistanceToNowStrict(new Date(reply.created_at), { addSuffix: true })
                  : '';

                return (
                  <div key={reply.id} className="flex gap-2">
                    <UserProfilePopover userId={reply.sender_id}>
                      <Avatar className="h-7 w-7 flex-shrink-0 cursor-pointer">
                        <AvatarImage src={replySender?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                          {replyInitials}
                        </AvatarFallback>
                      </Avatar>
                    </UserProfilePopover>
                    <div className="flex-1 min-w-0 bg-muted/60 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <UserProfilePopover userId={reply.sender_id}>
                          <span className="text-xs font-semibold text-foreground hover:underline cursor-pointer">
                            {replyName}
                          </span>
                        </UserProfilePopover>
                        <span className="text-[11px] text-muted-foreground">{replyTimeAgo}</span>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none break-words text-sm mt-0.5">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {reply.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Comment input */}
          {!isReadOnly && (
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border/30">
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                  {user?.email?.slice(0, 2).toUpperCase() || 'ME'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex items-center bg-card border border-border rounded-full px-3">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={handleCommentKeyDown}
                  placeholder="Write a comment..."
                  className="border-0 shadow-none focus-visible:ring-0 h-8 text-sm px-0"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0 text-primary"
                  onClick={handlePostComment}
                  disabled={!commentText.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
            <DialogDescription>
              Please provide a reason for reporting this post. An admin will review it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Why are you reporting this post?"
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
              Report Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
});

PostCard.displayName = 'PostCard';
