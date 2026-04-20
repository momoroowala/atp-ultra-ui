import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useChannelSettings } from '@/hooks/useChannelSettings';
import { Skeleton } from '@/components/ui/skeleton';

interface ChannelSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
}

export const ChannelSettingsModal = ({ open, onOpenChange, channelId }: ChannelSettingsModalProps) => {
  const { settings, isLoading, updateSettings } = useChannelSettings(channelId);

  const handleNotificationChange = (value: 'all' | 'mentions_only' | 'muted') => {
    updateSettings.mutate(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Channel Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-base font-medium">Notifications</Label>
            
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <RadioGroup
                value={settings?.notification_level || 'all'}
                onValueChange={handleNotificationChange}
                className="space-y-2"
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="flex-1 cursor-pointer">
                    <div className="font-medium">All messages</div>
                    <div className="text-sm text-muted-foreground">
                      Get notified for every new message
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="mentions_only" id="mentions" />
                  <Label htmlFor="mentions" className="flex-1 cursor-pointer">
                    <div className="font-medium">Mentions only</div>
                    <div className="text-sm text-muted-foreground">
                      Only get notified when someone mentions you
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="muted" id="muted" />
                  <Label htmlFor="muted" className="flex-1 cursor-pointer">
                    <div className="font-medium">Muted</div>
                    <div className="text-sm text-muted-foreground">
                      Don't receive any notifications from this channel
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
