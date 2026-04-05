import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useCommunityMessages } from '@/hooks/useCommunityMessages';
import type { CommunityMessage, SendMessageInput } from '@/hooks/useCommunityMessages';
import { PostCard } from './PostCard';
import { CreatePostCard } from './CreatePostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';

interface CommunityFeedProps {
  channelId: string;
  isReadOnly?: boolean;
  sendMessage: { mutate: (input: SendMessageInput) => void };
}

export const CommunityFeed = ({ channelId, isReadOnly, sendMessage }: CommunityFeedProps) => {
  const {
    messages,
    isLoading,
    deleteMessage,
    editMessage,
    loadMoreMessages,
    hasMoreMessages,
  } = useCommunityMessages(channelId);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sort messages newest-first for feed display
  const sortedMessages = useMemo(() => {
    return [...messages].reverse();
  }, [messages]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMoreMessages) return;
    setIsLoadingMore(true);
    try {
      await loadMoreMessages();
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreMessages, loadMoreMessages]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Skeleton create post card */}
        <div className="rounded-lg border border-border/50 bg-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 flex-1 rounded-full" />
          </div>
        </div>
        {/* Skeleton post cards */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border border-border/50 bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Create Post */}
        {!isReadOnly && (
          <CreatePostCard channelId={channelId} sendMessage={sendMessage} />
        )}

        {/* Posts */}
        {sortedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-3 text-muted-foreground/50" />
            <p className="text-lg font-medium">No posts yet</p>
            <p className="text-sm mt-1">Be the first to share something!</p>
          </div>
        ) : (
          <>
            {sortedMessages.map((message) => (
              <PostCard
                key={message.id}
                message={message}
                channelId={channelId}
                onDeleteMessage={(id) => deleteMessage.mutate(id)}
                onEditMessage={(id, content) => editMessage.mutate({ id, content })}
                isReadOnly={isReadOnly}
                sendMessage={sendMessage}
              />
            ))}

            {/* Load more */}
            {hasMoreMessages && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load older posts'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
