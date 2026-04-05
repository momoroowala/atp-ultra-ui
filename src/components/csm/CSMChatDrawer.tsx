import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { MessageList } from '@/components/community/MessageList';
import { MessageInput } from '@/components/community/MessageInput';
import { CommunityMessage, useCommunityMessages } from '@/hooks/useCommunityMessages';
import { useNavigate } from 'react-router-dom';

interface CSMChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  participantName: string;
}

export function CSMChatDrawer({ open, onOpenChange, conversationId, participantName }: CSMChatDrawerProps) {
  const navigate = useNavigate();
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);
  const { sendMessage } = useCommunityMessages(undefined, conversationId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col p-0 gap-0" hideOverlay onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold truncate">{participantName}</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground gap-1"
              onClick={() => {
                onOpenChange(false);
                navigate(`/1on1s/${conversationId}`);
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Community
            </Button>
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageList
            conversationId={conversationId}
            onReplyToMessage={setReplyingTo}
          />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-border p-3">
          <MessageInput
            conversationId={conversationId}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            sendMessage={sendMessage}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
