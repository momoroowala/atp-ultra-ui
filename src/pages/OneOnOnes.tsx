import { useState, useEffect, useCallback, Component, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageList } from '@/components/community/MessageList';
import { useCommunityMessages } from '@/hooks/useCommunityMessages';
import { MessageInput } from '@/components/community/MessageInput';
import { DMSidebar } from '@/components/one-on-ones/DMSidebar';
import { MobileDMTabs } from '@/components/one-on-ones/MobileDMTabs';
import { useCommunityDMs } from '@/hooks/useCommunityDMs';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Shield, MessageCircle } from 'lucide-react';
import { MobileLogoHeader } from '@/components/MobileLogoHeader';

// Error boundary to catch any Supabase-related crashes
class DMErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn('[OneOnOnes] Component error caught:', error?.message || error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center space-y-3 p-8">
            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-lg font-medium">Messages unavailable</p>
            <p className="text-sm">Direct messages require a database connection.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="text-sm text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const OneOnOnesInner = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { conversations, isLoading: dmsLoading, deleteDM, renameConversation } = useCommunityDMs();
  const { user } = useAuth();
  const { sendMessage: dmSendMessage } = useCommunityMessages(undefined, conversationId);

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

  // Empty unread counts (skip the hook that crashes)
  const dmUnreadCounts = new Map<string, number>();

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
            csmUserId={null}
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
              csmUserId={null}
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
              <div className="text-center space-y-2">
                <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground/50" />
                <p>Select a conversation to start chatting</p>
              </div>
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

const OneOnOnes = () => {
  return (
    <DMErrorBoundary>
      <OneOnOnesInner />
    </DMErrorBoundary>
  );
};

export default OneOnOnes;
