import { useMemo } from 'react';
import { useMainFeedMessages } from '@/hooks/useMainFeedMessages';
import { useMainFeedChannels } from '@/hooks/useMainFeedChannels';
import { FeedPost } from './FeedPost';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare } from 'lucide-react';

export const MainFeedList = () => {
  const { effectiveChannelIds, accessibleChannels } = useMainFeedChannels();
  const { messages, isLoading, pinMessage, unpinMessage, deleteMessage, editMessage } = useMainFeedMessages(effectiveChannelIds);

  // Build a channel name map for badges
  const channelMap = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string }>();
    accessibleChannels.forEach(c => map.set(c.id, { name: c.name, emoji: c.icon_emoji || '💬' }));
    return map;
  }, [accessibleChannels]);

  const sortedPosts = useMemo(() => {
    const posts = [...messages];
    posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
        <p className="text-sm">Posts from your selected channels will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {sortedPosts.map(post => {
        const channelInfo = post.channel_id ? channelMap.get(post.channel_id) : null;
        return (
          <FeedPost
            key={post.id}
            message={post}
            onPin={(id) => pinMessage.mutate(id)}
            onUnpin={(id) => unpinMessage.mutate(id)}
            onDelete={(id) => deleteMessage.mutate(id)}
            onEdit={(id, content) => editMessage.mutate({ id, content })}
            channelId={post.channel_id || undefined}
            showChannelBadge
            channelName={channelInfo?.name}
            channelEmoji={channelInfo?.emoji}
          />
        );
      })}
    </div>
  );
};
