import { Settings, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommunityChannel } from '@/hooks/useCommunityChannels';
import { useAdminCheck } from '@/hooks/useAdminCheck';

interface MobileChannelTabsProps {
  channels: CommunityChannel[];
  activeChannelId?: string;
  channelUnreadCounts: Map<string, number>;
  onSelectChannel: (id: string) => void;
  onOpenSettings: (channel: CommunityChannel) => void;
}

export const MobileChannelTabs = ({
  channels,
  activeChannelId,
  channelUnreadCounts,
  onSelectChannel,
  onOpenSettings,
}: MobileChannelTabsProps) => {
  const { isAdmin } = useAdminCheck();

  return (
    <div className="flex overflow-x-auto gap-2 px-4 py-3 border-b border-border bg-card scrollbar-hide">
      {channels.map((channel) => {
        const isActive = channel.id === activeChannelId;
        const unreadCount = channelUnreadCounts.get(channel.id) || 0;
        
        return (
          <button
            key={channel.id}
            onClick={() => onSelectChannel(channel.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap flex-shrink-0 transition-all",
              isActive 
                ? "bg-primary/15 border border-primary/30" 
                : "bg-transparent hover:bg-muted"
            )}
          >
            <span className="text-base">{channel.icon_emoji || '💬'}</span>
            <span className={cn(
              "text-sm font-medium",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {channel.name}
            </span>
            {channel.is_read_only && (
              <Megaphone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
            
            {isActive && isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSettings(channel);
                }}
                className="p-0.5 hover:bg-muted rounded"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            
            {!isActive && unreadCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1"
                style={{ background: 'radial-gradient(160.59% 161.46% at 50% 0%, #2D8F64 0%, #6EDAA6 100%), #55BD8A' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
