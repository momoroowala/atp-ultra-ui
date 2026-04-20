import { useState, useRef, useCallback } from 'react';
import { Plus, Settings, Users, Megaphone, Pin, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateChannelModal } from './CreateChannelModal';
import { ChannelSettingsModal } from './ChannelSettingsModal';
import { AdminChannelSettingsModal } from './AdminChannelSettingsModal';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { CommunityChannel } from '@/hooks/useCommunityChannels';
import { UseMutationResult } from '@tanstack/react-query';

interface ChannelSidebarProps {
  channels: CommunityChannel[];
  activeChannelId?: string;
  channelUnreadCounts: Map<string, number>;
  onSelectChannel: (id: string) => void;
  isLoading: boolean;
  reorderChannels?: UseMutationResult<void, Error, { id: string; pin_order: number }[]>;
}

export const ChannelSidebar = ({
  channels,
  activeChannelId,
  channelUnreadCounts,
  onSelectChannel,
  isLoading,
  reorderChannels,
}: ChannelSidebarProps) => {
  const { isAdmin, isCSM, isExecutive, isMegaAdmin } = useRoleCheck();
  const isStaff = isAdmin || isCSM || isExecutive;
  const canManageChannels = isAdmin || isMegaAdmin;
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [settingsChannelId, setSettingsChannelId] = useState<string | null>(null);
  const [adminSettingsChannel, setAdminSettingsChannel] = useState<CommunityChannel | null>(null);

  const dragItemIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragItemIndex.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((dropIndex: number) => {
    const dragIndex = dragItemIndex.current;
    if (dragIndex === null || dragIndex === dropIndex || !reorderChannels) return;

    const reordered = [...channels];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    const updates = reordered.map((ch, i) => ({ id: ch.id, pin_order: i }));
    reorderChannels.mutate(updates);

    dragItemIndex.current = null;
    setDragOverIndex(null);
  }, [channels, reorderChannels]);

  const handleDragEnd = useCallback(() => {
    dragItemIndex.current = null;
    setDragOverIndex(null);
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-16 px-4 flex items-center gap-3 bg-background border-b border-border">
        <Users className="h-6 w-6 text-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Community</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-6">
          {/* Main Feed Entry */}
          <div>
            <div
              className={`
                group flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer
              transition-colors min-h-[36px]
                ${activeChannelId === 'main'
                  ? 'bg-primary/15 border-l-2 border-l-primary'
                  : 'hover:bg-muted'
                }
              `}
              onClick={() => onSelectChannel('main')}
            >
              <span className="text-base">⭐</span>
              <span className={`flex-1 truncate font-medium text-sm ${activeChannelId === 'main' ? 'text-primary' : 'text-muted-foreground'}`}>
                Main Feed
              </span>
            </div>
          </div>

          {/* Channels Section */}
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Channels
              </span>
              {canManageChannels && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowCreateChannel(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-0.5">
              {channels.map((channel, index) => {
                const isActive = activeChannelId === channel.id;
                const unreadCount = channelUnreadCounts.get(channel.id) || 0;
                const isDragOver = dragOverIndex === index;
                
                return (
                  <div
                    key={channel.id}
                    draggable={canManageChannels}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className={`
                      group flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer
                      transition-colors min-h-[36px]
                      ${isActive 
                        ? 'bg-primary/15 border-l-2 border-l-primary' 
                        : 'hover:bg-muted'
                      }
                      ${isDragOver ? 'border-t-2 border-t-primary' : ''}
                    `}
                    style={dragItemIndex.current === index ? { opacity: 0.4 } : undefined}
                    onClick={() => onSelectChannel(channel.id)}
                  >
                    {canManageChannels && (
                      <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0" />
                    )}
                    <span className="text-base">{channel.icon_emoji || '💬'}</span>
                    <span title={channel.name} className={`flex-1 truncate font-medium text-sm ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {channel.name}
                    </span>
                    {channel.is_pinned && (
                      <Pin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                    {channel.is_read_only && (
                      <Megaphone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    )}
                    
                    {unreadCount > 0 && !isActive && (
                      <span 
                        className="text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center"
                        style={{ background: 'radial-gradient(160.59% 161.46% at 50% 0%, #2D8F64 0%, #6EDAA6 100%), #55BD8A' }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (canManageChannels) {
                          setAdminSettingsChannel(channel);
                        } else {
                          setSettingsChannelId(channel.id);
                        }
                      }}
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                );
              })}
              {channels.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-2">
                  No channels available
                </p>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Modals */}
      <CreateChannelModal
        open={showCreateChannel}
        onOpenChange={setShowCreateChannel}
      />
      {settingsChannelId && !canManageChannels && (
        <ChannelSettingsModal
          open={!!settingsChannelId}
          onOpenChange={(open) => !open && setSettingsChannelId(null)}
          channelId={settingsChannelId}
        />
      )}
      <AdminChannelSettingsModal
        open={!!adminSettingsChannel}
        onOpenChange={(open) => !open && setAdminSettingsChannel(null)}
        channel={adminSettingsChannel}
      />
    </div>
  );
};
