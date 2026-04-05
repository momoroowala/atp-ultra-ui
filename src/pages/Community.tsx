import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChannelSidebar } from '@/components/community/ChannelSidebar';
import { MobileChannelTabs } from '@/components/community/MobileChannelTabs';
import { CommunityFeed } from '@/components/community/CommunityFeed';
import { NotificationPermissionBanner, NotificationBlockedBanner } from '@/components/community/NotificationPermissionBanner';
import { AdminChannelSettingsModal } from '@/components/community/AdminChannelSettingsModal';
import { useCommunityChannels, CommunityChannel } from '@/hooks/useCommunityChannels';
import { useCommunityMessages } from '@/hooks/useCommunityMessages';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { Megaphone } from 'lucide-react';
import { MobileLogoHeader } from '@/components/MobileLogoHeader';

const Community = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [settingsChannel, setSettingsChannel] = useState<CommunityChannel | null>(null);
  const { isAdmin, isCSM, isExecutive } = useRoleCheck();
  const isStaff = isAdmin || isCSM || isExecutive;

  const { channels, isLoading: channelsLoading, reorderChannels } = useCommunityChannels();
  const { sendMessage } = useCommunityMessages(channelId);
  const { channelUnreadCounts, markChannelAsRead } = useUnreadCounts(channelId);

  // Mark channel as read when selected
  useEffect(() => {
    if (channelId) {
      markChannelAsRead.mutate(channelId);
    }
  }, [channelId]);

  // Auto-select first channel if none selected
  useEffect(() => {
    if (!channelId && channels.length > 0 && !channelsLoading) {
      navigate(`/community/${channels[0].id}`, { replace: true });
    }
  }, [channelId, channels, channelsLoading, navigate]);

  const activeChannel = channels.find(c => c.id === channelId);
  const activeName = activeChannel?.name || (channelsLoading ? 'Loading...' : 'Select a community');

  return (
    <div className="flex flex-1 overflow-hidden h-full" data-tour="community-area">
      {isMobile ? (
        <>
          {/* Main Feed Area (Mobile) */}
          <div className="flex-1 flex flex-col min-w-0">
            <MobileLogoHeader className="py-2 border-b border-border" />
            <MobileChannelTabs
              channels={channels}
              activeChannelId={channelId}
              channelUnreadCounts={channelUnreadCounts}
              onSelectChannel={(id) => navigate(`/community/${id}`)}
              onOpenSettings={setSettingsChannel}
            />

            <NotificationPermissionBanner />
            <NotificationBlockedBanner />

            <div className="flex-1 overflow-hidden">
              {channelId ? (
                activeChannel?.is_read_only && !isStaff ? (
                  <div className="flex flex-col h-full">
                    <CommunityFeed
                      channelId={channelId}
                      isReadOnly
                      sendMessage={sendMessage}
                    />
                    <div className="border-t border-border bg-muted/50 px-4 py-3 flex items-center justify-center gap-2">
                      <Megaphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">This is an announcements community. Only staff can post.</span>
                    </div>
                  </div>
                ) : (
                  <CommunityFeed
                    channelId={channelId}
                    sendMessage={sendMessage}
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a community to view posts
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-full w-full">
          {/* Left Sidebar */}
          <div className="w-[280px] min-w-[280px] bg-card flex flex-col h-full md:rounded-tl-2xl border-r border-border">
            <ChannelSidebar
              channels={channels}
              activeChannelId={channelId}
              channelUnreadCounts={channelUnreadCounts}
              onSelectChannel={(id) => navigate(`/community/${id}`)}
              isLoading={channelsLoading}
              reorderChannels={reorderChannels}
            />
          </div>

          {/* Main Feed Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-background">
            {/* Feed Header */}
            <header className="border-b border-border bg-card flex-shrink-0">
              <div className="h-16 flex items-center px-6 gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {activeChannel && (
                    <span className="text-xl">{activeChannel.icon_emoji || '\uD83D\uDCAC'}</span>
                  )}
                  <div>
                    <h1 className="text-lg font-bold text-foreground truncate">
                      {activeName}
                    </h1>
                    {activeChannel?.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-md">
                        {activeChannel.description}
                      </p>
                    )}
                  </div>
                </div>
                {activeChannel?.is_read_only && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full">
                    <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Announcements</span>
                  </div>
                )}
              </div>
            </header>

            <NotificationPermissionBanner />
            <NotificationBlockedBanner />

            <div className="flex-1 overflow-hidden">
              {channelId ? (
                <CommunityFeed
                  channelId={channelId}
                  isReadOnly={activeChannel?.is_read_only && !isStaff}
                  sendMessage={sendMessage}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium">Select a community</p>
                    <p className="text-sm">Choose a community from the sidebar to view posts</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AdminChannelSettingsModal
        open={!!settingsChannel}
        onOpenChange={(open) => !open && setSettingsChannel(null)}
        channel={settingsChannel}
      />
    </div>
  );
};

export default Community;
