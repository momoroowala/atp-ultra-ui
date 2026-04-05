import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useCommunityMessages, CommunityMessage } from '@/hooks/useCommunityMessages';
import { MessageItem } from './MessageItem';
import { PinnedMessagesBanner } from './PinnedMessagesBanner';
import { ThreadDrawer } from './ThreadDrawer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface MessageListProps {
  channelId?: string;
  conversationId?: string;
  onReplyToMessage?: (message: CommunityMessage) => void;
  isReadOnly?: boolean;
}

export const MessageList = ({ channelId, conversationId, onReplyToMessage, isReadOnly }: MessageListProps) => {
  const { messages, isLoading, pinMessage, unpinMessage, deleteMessage, editMessage, loadMoreMessages, hasMoreMessages } = useCommunityMessages(channelId, conversationId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [threadMessage, setThreadMessage] = useState<CommunityMessage | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages) return;
    const container = containerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;
    setIsLoadingMore(true);
    try {
      await loadMoreMessages();
      // Preserve scroll position after prepending older messages
      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - prevScrollHeight;
        }
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreMessages, loadMoreMessages]);

  const isDM = !!conversationId;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const pinnedMessages = useMemo(() => messages.filter(m => m.is_pinned), [messages]);

  const scrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el && containerRef.current) {
      const container = containerRef.current;
      const elTop = el.offsetTop;
      container.scrollTop = elTop - container.clientHeight / 2;
      el.classList.add('bg-primary/10');
      setTimeout(() => el.classList.remove('bg-primary/10'), 2000);
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at || '');
    let dateKey: string;
    
    if (isToday(date)) {
      dateKey = 'Today';
    } else if (isYesterday(date)) {
      dateKey = 'Yesterday';
    } else {
      dateKey = format(date, 'MMMM d, yyyy');
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {} as Record<string, typeof messages>);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-3">
          <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/50" />
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm">Be the first to send a message!</p>
          <p className="text-xs text-muted-foreground/70">You can use @mentions, reactions, and file attachments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PinnedMessagesBanner pinnedMessages={pinnedMessages} onScrollToMessage={scrollToMessage} />
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
        {/* Load more button */}
        {hasMoreMessages && (
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="text-xs"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load older messages'
              )}
            </Button>
          </div>
        )}
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date Separator */}
            <div className="flex justify-center my-6">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {date}
              </span>
            </div>

            <div className="space-y-1">
              {dateMessages.map((message, index) => {
                const prevMessage = index > 0 ? dateMessages[index - 1] : null;
                const isConsecutive = prevMessage?.sender_id === message.sender_id &&
                  new Date(message.created_at || '').getTime() - 
                  new Date(prevMessage?.created_at || '').getTime() < 5 * 60 * 1000;

                return (
                  <div key={message.id} id={`msg-${message.id}`} className="transition-colors duration-1000">
                    <MessageItem
                      message={message}
                      isConsecutive={isConsecutive}
                      onReply={isReadOnly ? undefined : () => setThreadMessage(message)}
                      onPin={(id) => pinMessage.mutate(id)}
                      onUnpin={(id) => unpinMessage.mutate(id)}
                      onDeleteMessage={(id) => deleteMessage.mutate(id)}
                      onEditMessage={(id, content) => editMessage.mutate({ id, content })}
                      isDM={isDM}
                      isReadOnly={isReadOnly}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <ThreadDrawer
        message={threadMessage}
        channelId={channelId}
        conversationId={conversationId}
        onClose={() => setThreadMessage(null)}
      />
    </div>
  );
};
