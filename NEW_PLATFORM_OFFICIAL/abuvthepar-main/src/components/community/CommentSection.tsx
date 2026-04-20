import { useState, useRef, useMemo, KeyboardEvent } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Send, SmilePlus, Pencil, Trash2, Check, X, ChevronDown } from 'lucide-react';
import { useThreadReplies, SendMessageInput } from '@/hooks/useCommunityMessages';
import { useCommunityMessages } from '@/hooks/useCommunityMessages';
import { useCommunityReactions } from '@/hooks/useCommunityReactions';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { UserProfilePopover } from '@/components/UserProfilePopover';
import { ReactionPicker } from './ReactionPicker';
import { formatMessageTime } from '@/utils/messageTimeFormatter';
import { Skeleton } from '@/components/ui/skeleton';
import type { CommunityMessage } from '@/hooks/useCommunityMessages';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CommentSectionProps {
  postId: string;
  channelId?: string;
  isReadOnly?: boolean;
}

export const CommentSection = ({ postId, channelId, isReadOnly }: CommentSectionProps) => {
  const { user } = useAuth();
  const { isAdmin, isCSM, isExecutive } = useRoleCheck();
  const isStaff = isAdmin || isCSM || isExecutive;
  const { replies: comments, isLoading } = useThreadReplies(postId);
  const { sendMessage, editMessage, deleteMessage } = useCommunityMessages(channelId);
  const { toggleReaction } = useCommunityReactions();
  const [commentText, setCommentText] = useState('');
  const [showAll, setShowAll] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-sender', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('user_public_profiles').select('id, first_name, last_name, user_email, avatar_url').eq('id', user?.id!).single();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const visibleComments = showAll ? comments : comments.slice(0, 3);
  const hasMore = comments.length > 3 && !showAll;

  const handleSendComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    sendMessage.mutate({
      content: trimmed,
      channel_id: channelId,
      parent_message_id: postId,
    });
    setCommentText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const initials = userProfile
    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="border-t border-border bg-muted/30">
      {/* Comments list */}
      <div className="px-4 pt-3 space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {visibleComments.map(comment => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isStaff={isStaff}
                onEdit={(id, content) => editMessage.mutate({ id, content })}
                onDelete={(id) => deleteMessage.mutate(id)}
                onReaction={(id, emoji) => toggleReaction.mutate({ messageId: id, emoji })}
              />
            ))}
            {hasMore && (
              <button
                onClick={() => setShowAll(true)}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 pb-1"
              >
                <ChevronDown className="h-4 w-4" />
                View all {comments.length} comments
              </button>
            )}
          </>
        )}
      </div>

      {/* Comment input */}
      {!isReadOnly && (
        <div className="flex items-center gap-2 px-4 py-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userProfile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex items-center bg-background border border-border rounded-full px-3">
            <textarea
              ref={inputRef}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment..."
              rows={1}
              className="flex-1 bg-transparent border-0 outline-none text-sm py-2 resize-none max-h-[80px]"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary"
              onClick={handleSendComment}
              disabled={!commentText.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Individual comment item
const CommentItem = ({
  comment,
  isStaff,
  onEdit,
  onDelete,
  onReaction,
}: {
  comment: CommunityMessage;
  isStaff: boolean;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onReaction: (id: string, emoji: string) => void;
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const reactionBtnRef = useRef<HTMLButtonElement>(null);

  const sender = comment.sender;
  const fullName = sender ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim() : '';
  const name = fullName || sender?.user_email || 'Unknown User';
  const initials = fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : name.slice(0, 2).toUpperCase();
  const canEdit = user?.id === comment.sender_id;
  const canDelete = user?.id === comment.sender_id || isStaff;

  const handleSave = () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === comment.content) { setIsEditing(false); return; }
    onEdit(comment.id, trimmed);
    setIsEditing(false);
  };

  return (
    <div className="group flex gap-2">
      <UserProfilePopover userId={comment.sender_id}>
        <Avatar className="h-8 w-8 cursor-pointer flex-shrink-0">
          <AvatarImage src={sender?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </UserProfilePopover>
      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-xl px-3 py-2">
          <UserProfilePopover userId={comment.sender_id}>
            <span className="font-semibold text-xs text-foreground hover:underline cursor-pointer">{name}</span>
          </UserProfilePopover>
          {isEditing ? (
            <div className="mt-1">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } if (e.key === 'Escape') { setIsEditing(false); setEditContent(comment.content); } }}
                className="w-full bg-background border border-border rounded px-2 py-1 text-sm outline-none resize-none"
                autoFocus
              />
              <div className="flex gap-1 mt-1">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setIsEditing(false); setEditContent(comment.content); }}><X className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-primary" onClick={handleSave}><Check className="h-3 w-3" /></Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">{comment.content}</p>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 px-1">
          <span className="text-xs text-muted-foreground">{formatMessageTime(comment.created_at)}</span>
          {comment.is_edited && <span className="text-xs text-muted-foreground italic">edited</span>}
          
          {/* Inline reactions */}
          {comment.reactions && comment.reactions.length > 0 && (
            <div className="flex gap-1">
              {comment.reactions.map(r => (
                <button
                  key={r.emoji}
                  onClick={() => onReaction(comment.id, r.emoji)}
                  className={`text-xs px-1.5 py-0.5 rounded-full border ${r.users.includes(user?.id || '') ? 'bg-primary/10 border-primary/30' : 'border-border'}`}
                >
                  {r.emoji} {r.count}
                </button>
              ))}
            </div>
          )}

          {/* Hover actions */}
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
            <div className="relative">
              <button ref={reactionBtnRef} onClick={() => setShowReactionPicker(!showReactionPicker)} className="text-xs text-muted-foreground hover:text-foreground">
                <SmilePlus className="h-3 w-3" />
              </button>
              {showReactionPicker && (
                <ReactionPicker
                  onSelect={(emoji) => { onReaction(comment.id, emoji); setShowReactionPicker(false); }}
                  onClose={() => setShowReactionPicker(false)}
                  triggerRect={reactionBtnRef.current?.getBoundingClientRect() ?? null}
                />
              )}
            </div>
            {canEdit && (
              <button onClick={() => { setIsEditing(true); setEditContent(comment.content); }} className="text-xs text-muted-foreground hover:text-foreground">
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {canDelete && (
              <button onClick={() => onDelete(comment.id)} className="text-xs text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
