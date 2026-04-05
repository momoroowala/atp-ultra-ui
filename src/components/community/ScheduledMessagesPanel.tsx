import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarClock, X, Repeat } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useScheduledMessages } from '@/hooks/useScheduledMessages';
import { Badge } from '@/components/ui/badge';

interface ScheduledMessagesPanelProps {
  channelId?: string;
  dmConversationId?: string;
}

export const ScheduledMessagesPanel = ({ channelId, dmConversationId }: ScheduledMessagesPanelProps) => {
  const { scheduledMessages, cancelScheduledMessage } = useScheduledMessages(channelId, dmConversationId);

  if (scheduledMessages.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <CalendarClock className="h-3.5 w-3.5" />
          {scheduledMessages.length} scheduled
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="text-sm font-medium">Scheduled Messages</h4>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {scheduledMessages.map((msg) => (
            <div key={msg.id} className="p-3 border-b last:border-0 hover:bg-muted/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{msg.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(msg.scheduled_at), 'MMM d, h:mm a')}
                    </span>
                    {msg.is_recurring && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 gap-0.5">
                        <Repeat className="h-2.5 w-2.5" />
                        {msg.recurrence_pattern}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => cancelScheduledMessage.mutate(msg.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
