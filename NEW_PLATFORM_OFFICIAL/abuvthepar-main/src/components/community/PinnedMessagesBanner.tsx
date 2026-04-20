import { useState } from 'react';
import { Pin, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CommunityMessage } from '@/hooks/useCommunityMessages';

interface PinnedMessagesBannerProps {
  pinnedMessages: CommunityMessage[];
  onScrollToMessage?: (messageId: string) => void;
}

export const PinnedMessagesBanner = ({ pinnedMessages, onScrollToMessage }: PinnedMessagesBannerProps) => {
  const [expanded, setExpanded] = useState(false);

  if (pinnedMessages.length === 0) return null;

  return (
    <div className="border-b border-border bg-muted/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
      >
        <Pin className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="font-medium text-foreground">
          {pinnedMessages.length} pinned {pinnedMessages.length === 1 ? 'message' : 'messages'}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 ml-auto text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {pinnedMessages.map((msg) => {
            const senderName = msg.sender
              ? `${msg.sender.first_name || ''} ${msg.sender.last_name || ''}`.trim() || msg.sender.user_email || 'Unknown'
              : 'Unknown';

            return (
              <button
                key={msg.id}
                onClick={() => onScrollToMessage?.(msg.id)}
                className="w-full text-left flex items-start gap-2 p-2 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors"
              >
                <Pin className="h-3 w-3 text-primary mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-foreground">{senderName}</span>
                  <p className="text-sm text-muted-foreground truncate">{msg.content}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
