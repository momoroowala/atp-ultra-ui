import { useMemo } from 'react';
import { useCommunityMessages, CommunityMessage } from '@/hooks/useCommunityMessages';
import { FeedPost } from './FeedPost';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare } from 'lucide-react';

interface FeedListProps {
  channelId?: string;
  isReadOnly?: boolean;
}

export const FeedList = ({ channelId, isReadOnly }: FeedListProps) => {
  const { messages, isLoading, pinMessage, unpinMessage, deleteMessage, editMessage } = useCommunityMessages(channelId);

  // Sort newest first, pinned posts at top
  const sortedPosts = useMemo(() => {
    const posts = [...messages];
    // Sort by created_at DESC
    posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    // Move pinned posts to top
    const pinned = posts.filter(p => p.is_pinned);
    const unpinned = posts.filter(p => !p.is_pinned);
    return [...pinned, ...unpinned];
  }, [messages]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (sortedPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-lg font-medium">No posts yet</p>
        <p className="text-sm">Be the first to share something!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {sortedPosts.map(post => (
        <FeedPost
          key={post.id}
          message={post}
          onPin={(id) => pinMessage.mutate(id)}
          onUnpin={(id) => unpinMessage.mutate(id)}
          onDelete={(id) => deleteMessage.mutate(id)}
          onEdit={(id, content) => editMessage.mutate({ id, content })}
          channelId={channelId}
          isReadOnly={isReadOnly}
        />
      ))}
    </div>
  );
};
