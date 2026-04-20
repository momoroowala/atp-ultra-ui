import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageList } from '@/components/community/MessageList';
import { useCommunityMessages } from '@/hooks/useCommunityMessages';
import { MessageInput } from '@/components/community/MessageInput';
import { DMSidebar } from '@/components/one-on-ones/DMSidebar';
import { MobileDMTabs } from '@/components/one-on-ones/MobileDMTabs';
import { useCommunityDMs } from '@/hooks/useCommunityDMs';
import { useAssignedCSM } from '@/hooks/useAssignedCSM';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { useIsMobile } from '@/hooks/use-mobile';
import { Shield } from 'lucide-react';
import { MobileLogoHeader } from '@/components/MobileLogoHeader';

const OneOnOnes = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { conversations, isLoading: dmsLoading, deleteDM, renameConversation } = useCommunityDMs();
  const { featureAccess } = useAuth();
  const { sendMessage: dmSendMessage } = useCommunityMessages(undefined, conversationId);
  const { csmId } = useAssignedCSM();

  const { dmUnreadCounts, markDmAsRead } = useUnreadCounts(undefined, conversationId);

  const handleDeleteConversation = useCallback((convId: string) => {
    deleteDM.mutate(convId, {
      onSuccess: () => {
        if (conversationId === convId && conversations.length > 0) {
          navigate(`/1on1s/${conversations[0].id}`, { replace: true });
        }
      },
    });
  }, [deleteDM, conversationId, conversations, navigate]);

  const handleRenameConversation = useCallback((convId: string, name: string) => {
    renameConversation.mutate({ id: convId, name });
  }, [renameConversation]);

  // Mark DM as read when selected
  useEffect(() => {
    if (conversationId) {
      markDmAsRead.mutate(conversationId);
    }
  }, [conversationId]);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!conversationId && conversations.length > 0 && !dmsLoading) {
      navigate(`/1on1s/${conversations[0].id}`, { replace: true });
    }
  }, [conversationId, conversations, dmsLoading, navigate]);

  const activeConversation = conversations.find(c => c.id === conversationId);
  const activeName = activeConversation
    ? (activeConversation.name
      ? activeConversation.name
      : activeConversation.participants?.length > 1
      ? activeConversation.participants.map(p => `${p.first_name || ''}`.trim() || p.user_email || 'Unknown').join(', ')
      : (() => {
          const p = activeConversation.participants?.[0];
          const fullName = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : '';
          return fullName || p?.user_email || 'Direct Message';
        })())
    : 'Select a conversation';

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-64 bg-card border-r border-border flex-shrink-0 flex flex-col h-full md:rounded-tl-2xl">
          <DMSidebar
            conversations={conversations as any}
            activeConversationId={conversationId}
            dmUnreadCounts={dmUnreadCounts}
            onSelectConversation={(id) => navigate(`/1on1s/${id}`)}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={handleRenameConversation}
            csmUserId={csmId}
            isLoading={dmsLoading}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile: Logo Header + DM Tabs */}
        {isMobile && (
          <>
            <MobileLogoHeader className="py-2 border-b border-border" />
            <MobileDMTabs
              conversations={conversations as any}
              activeConversationId={conversationId}
              dmUnreadCounts={dmUnreadCounts}
              onSelectConversation={(id) => navigate(`/1on1s/${id}`)}
              csmUserId={csmId}
            />
          </>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <header className="border-b border-border bg-card flex flex-col flex-shrink-0">
            <div className="h-16 flex items-center px-4 gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-foreground truncate">
                  {activeName}
                </h1>
              </div>
              {conversationId && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                  <Shield className="h-3 w-3" />
                  <span>DMs may be monitored for safety</span>
                </div>
              )}
            </div>
          </header>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          {conversationId ? (
            <MessageList
              conversationId={conversationId}
              onReplyToMessage={() => {}}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a conversation to start chatting
            </div>
          )}
        </div>

        {/* Input */}
        {conversationId && (
          <div className="border-t border-border bg-background p-4">
            <MessageInput
              conversationId={conversationId}
              sendMessage={dmSendMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OneOnOnes;
