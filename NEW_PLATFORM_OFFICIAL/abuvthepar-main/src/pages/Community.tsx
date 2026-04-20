import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChannelSidebar } from '@/components/community/ChannelSidebar';
import { MobileChannelTabs } from '@/components/community/MobileChannelTabs';
import { PostComposer } from '@/components/community/PostComposer';
import { FeedList } from '@/components/community/FeedList';
import { MainFeedList } from '@/components/community/MainFeedList';
import { CommunityShaderBackground } from '@/components/community/CommunityShaderBackground';
import { NotificationPermissionBanner, NotificationBlockedBanner } from '@/components/community/NotificationPermissionBanner';
import { AdminChannelSettingsModal } from '@/components/community/AdminChannelSettingsModal';
import { useCommunityChannels, CommunityChannel } from '@/hooks/useCommunityChannels';
import { useCommunityMessages } from '@/hooks/useCommunityMessages';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { MainFeedChannelPicker } from '@/components/community/MainFeedChannelPicker';
import { Hash, Megaphone, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { MobileLogoHeader } from '@/components/MobileLogoHeader';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const ZOOM_KEY = 'community-zoom-level';

const Community = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [settingsChannel, setSettingsChannel] = useState<CommunityChannel | null>(null);
  const { isAdmin, isCSM, isExecutive } = useRoleCheck();
  const isStaff = isAdmin || isCSM || isExecutive;

  const [zoomLevel, setZoomLevel] = useState(() => {
    const saved = localStorage.getItem(ZOOM_KEY);
    return saved ? Number(saved) : 100;
  });

  useEffect(() => {
    localStorage.setItem(ZOOM_KEY, String(zoomLevel));
  }, [zoomLevel]);

  const isMainFeed = channelId === 'main';
  const { channels, isLoading: channelsLoading, reorderChannels } = useCommunityChannels();
  const { sendMessage } = useCommunityMessages(isMainFeed ? undefined : channelId);
  const { channelUnreadCounts, markChannelAsRead } = useUnreadCounts(isMainFeed ? undefined : channelId);

  useEffect(() => {
    if (channelId && !isMainFeed) {
      markChannelAsRead.mutate(channelId);
    }
  }, [channelId, isMainFeed]);

  useEffect(() => {
    if (!channelId && !channelsLoading) {
      navigate('/community/main', { replace: true });
    }
  }, [channelId, channelsLoading, navigate]);

  const activeChannel = isMainFeed ? null : channels.find(c => c.id === channelId);
  const activeName = isMainFeed ? 'Main Feed' : (activeChannel?.name || 'Select a channel');


  const ZoomControls = () => (
    <div className="flex items-center gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoomLevel(Math.max(75, zoomLevel - 5))}
            disabled={zoomLevel <= 75}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom out</TooltipContent>
      </Tooltip>

      <Slider
        value={[zoomLevel]}
        onValueChange={([v]) => setZoomLevel(v)}
        min={75}
        max={130}
        step={5}
        className="w-20"
      />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setZoomLevel(Math.min(130, zoomLevel + 5))}
            disabled={zoomLevel >= 130}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom in</TooltipContent>
      </Tooltip>

      <span className="text-xs text-muted-foreground w-8 text-center tabular-nums">{zoomLevel}%</span>

      {zoomLevel !== 100 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoomLevel(100)}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset zoom</TooltipContent>
        </Tooltip>
      )}
    </div>
  );

  return (
    <div className="flex flex-1 overflow-hidden h-full" data-tour="community-area">
      {isMobile ? (
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

          <div className="flex-1 overflow-y-auto relative">
            <CommunityShaderBackground />
            <div className="relative z-10">
              {isMainFeed ? (
                <MainFeedList />
              ) : channelId ? (
                <>
                  {!(activeChannel?.is_read_only && !isStaff) && (
                    <div className="p-4 pb-0">
                      <PostComposer channelId={channelId} sendMessage={sendMessage} />
                    </div>
                  )}
                  {activeChannel?.is_read_only && !isStaff && (
                    <div className="px-4 pt-4 flex items-center justify-center gap-2">
                      <Megaphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">This is an announcement channel. Only staff can post.</span>
                    </div>
                  )}
                  <FeedList channelId={channelId} isReadOnly={activeChannel?.is_read_only && !isStaff} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a channel to start chatting
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={35} minSize={15} maxSize={35} className="bg-card flex flex-col h-full md:rounded-tl-2xl overflow-hidden">
            <div
              className="flex-1 overflow-y-auto"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top left',
                width: `${10000 / zoomLevel}%`,
                minHeight: `${10000 / zoomLevel}%`,
              }}
            >
              <ChannelSidebar
                channels={channels}
                activeChannelId={channelId}
                channelUnreadCounts={channelUnreadCounts}
                onSelectChannel={(id) => navigate(`/community/${id}`)}
                isLoading={channelsLoading}
                reorderChannels={reorderChannels}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={80} className="flex flex-col min-w-0">
            <header className="border-b border-border bg-card flex flex-col flex-shrink-0">
              <div className="h-16 flex items-center px-4 gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isMainFeed ? (
                    <span className="text-lg">⭐</span>
                  ) : activeChannel ? (
                    <Hash className="h-5 w-5 text-muted-foreground" />
                  ) : null}
                  <h1 className="text-lg font-semibold text-foreground truncate">
                    {activeName}
                  </h1>
                </div>
                {isMainFeed && <MainFeedChannelPicker />}
                <ZoomControls />
              </div>
            </header>

            <NotificationPermissionBanner />
            <NotificationBlockedBanner />

            <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
              <CommunityShaderBackground />
              <div
                className="relative z-10"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                  width: `${10000 / zoomLevel}%`,
                  marginLeft: `${(100 - 10000 / zoomLevel) / 2}%`,
                }}
              >
                <div className="max-w-4xl mx-auto">
                {isMainFeed ? (
                  <MainFeedList />
                ) : channelId ? (
                  <>
                    {!(activeChannel?.is_read_only && !isStaff) && (
                      <div className="p-4 pb-0">
                        <PostComposer channelId={channelId} sendMessage={sendMessage} />
                      </div>
                    )}
                    {activeChannel?.is_read_only && !isStaff && (
                      <div className="px-4 pt-4 flex items-center justify-center gap-2">
                        <Megaphone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">This is an announcement channel. Only staff can post.</span>
                      </div>
                    )}
                    <FeedList channelId={channelId} isReadOnly={activeChannel?.is_read_only && !isStaff} />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select a channel to start chatting
                  </div>
                )}
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
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
