import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { useMainFeedChannels } from '@/hooks/useMainFeedChannels';

interface MainFeedChannelPickerProps {
  children?: React.ReactNode;
}

export const MainFeedChannelPicker = ({ children }: MainFeedChannelPickerProps) => {
  const {
    effectiveChannelIds,
    savedChannelIds,
    hasCustomSelection,
    toggleChannel,
    setAllChannels,
    accessibleChannels,
  } = useMainFeedChannels();

  const isChannelSelected = (channelId: string) => {
    return effectiveChannelIds.includes(channelId);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start" side="bottom">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Feed Channels</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAllChannels.mutate(true)}
              disabled={!hasCustomSelection}
            >
              Select All
            </Button>
          </div>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {accessibleChannels.map(channel => (
              <label
                key={channel.id}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={isChannelSelected(channel.id)}
                  onCheckedChange={() => toggleChannel.mutate(channel.id)}
                />
                <span className="text-base leading-none">{channel.icon_emoji || '💬'}</span>
                <span className="text-sm text-foreground truncate">{channel.name}</span>
              </label>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
