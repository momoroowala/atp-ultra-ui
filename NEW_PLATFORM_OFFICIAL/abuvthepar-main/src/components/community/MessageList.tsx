import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { useCommunityMessages, CommunityMessage } from '@/hooks/useCommunityMessages';
import { MessageItem } from './MessageItem';
import { PinnedMessagesBanner } from './PinnedMessagesBanner';
import { ThreadDrawer } from './ThreadDrawer';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isToday, isYesterday } from 'date-fns';

interface MessageListProps {
  channelId?: string;
  conversationId?: string;
  onReplyToMessage?: (message: CommunityMessage) => void;
  isReadOnly?: boolean;
}

export const MessageList = ({ channelId, conversationId, onReplyToMessage, isReadOnly }: MessageListProps) => {
  const { messages, isLoading, pinMessage, unpinMessage, deleteMessage, editMessage } = useCommunityMessages(channelId, conversationId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [threadMessage, setThreadMessage] = useState<CommunityMessage | null>(null);

  const isDM = !!conversationId;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const pinnedMessages = useMemo(() => messages.filter(m => m.is_pinned), [messages]);

  // Stable callbacks so memoized MessageItem children don't re-render on every
  // parent render. Mutation objects from TanStack Query are stable refs, so
  // these handlers only need to depend on them once.
  const handleReply = useCallback((m: CommunityMessage) => setThreadMessage(m), []);
  const handlePin = useCallback((id: string) => pinMessage.mutate(id), [pinMessage]);
  const handleUnpin = useCallback((id: string) => unpinMessage.mutate(id), [unpinMessage]);
  const handleDelete = useCallback((id: string) => deleteMessage.mutate(id), [deleteMessage]);
  const handleEdit = useCallback(
    (id: string, content: string) => editMessage.mutate({ id, content }),
    [editMessage]
  );

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
        <div className="text-center">
          <p className="text-lg font-medium">No messages yet</p>
          <p className="text-sm">Be the first to send a message!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <PinnedMessagesBanner pinnedMessages={pinnedMessages} onScrollToMessage={scrollToMessage} />
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
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
                      onReply={isReadOnly ? undefined : handleReply}
                      onPin={handlePin}
                      onUnpin={handleUnpin}
                      onDeleteMessage={handleDelete}
                      onEditMessage={handleEdit}
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
