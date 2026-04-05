import { useEffect, useRef, useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { useThreadReplies, useCommunityMessages } from '@/hooks/useCommunityMessages';
import type { CommunityMessage } from '@/hooks/useCommunityMessages';
import { MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useCommunityChannels } from '@/hooks/useCommunityChannels';

interface ThreadDrawerProps {
  message: CommunityMessage | null;
  channelId?: string;
  conversationId?: string;
  onClose: () => void;
}

export const ThreadDrawer = ({ message, channelId, conversationId, onClose }: ThreadDrawerProps) => {
  const { replies, isLoading } = useThreadReplies(message?.id);
  const { sendMessage } = useCommunityMessages(channelId, conversationId);
  const { channels } = useCommunityChannels();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [alsoSendToChannel, setAlsoSendToChannel] = useState(false);

  const currentChannel = channelId ? channels?.find(c => c.id === channelId) : null;

  // Auto-scroll when new replies arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  const handleAfterSend = useCallback((content: string, attachments: { url: string; type: string; name: string }[], mentionUserIds: string[]) => {
    if (alsoSendToChannel && channelId) {
      sendMessage.mutate({
        content,
        channel_id: channelId,
        shared_from_thread_id: message?.id,
        attachments: attachments.length > 0 ? attachments.map(a => ({
          ...a,
          type: a.type.startsWith('image/') ? 'image' as const : 'file' as const
        })) : undefined,
        mentions: mentionUserIds.length > 0 ? mentionUserIds : undefined,
      });
      setAlsoSendToChannel(false);
    }
  }, [alsoSendToChannel, channelId, sendMessage]);

  const replyCount = replies.length;

  return (
    <Sheet open={!!message} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[420px] flex flex-col p-0 gap-0"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-border flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-5 w-5 text-primary" />
            Thread
            {replyCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                · {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Thread content */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {/* Parent message */}
          {message && (
            <div className="pb-3 mb-3 border-b border-border">
              <MessageItem
                message={message}
                isReply={false}
                isReadOnly
              />
            </div>
          )}

          {/* Replies */}
          {isLoading ? (
            <div className="space-y-3 px-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            replies.map((reply) => (
              <MessageItem
                key={reply.id}
                message={reply}
                isReply
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply input */}
        {message && (
          <div className="border-t border-border bg-background p-3 flex-shrink-0 space-y-2">
            {currentChannel && (
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={alsoSendToChannel}
                  onCheckedChange={(checked) => setAlsoSendToChannel(checked === true)}
                />
                <span className="text-xs text-muted-foreground">
                  Also send to <span className="font-semibold text-foreground">#{currentChannel.name}</span>
                </span>
              </label>
            )}
            <MessageInput
              channelId={channelId}
              conversationId={conversationId}
              replyingTo={message}
              onCancelReply={() => {}}
              sendMessage={sendMessage}
              onAfterSend={handleAfterSend}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};