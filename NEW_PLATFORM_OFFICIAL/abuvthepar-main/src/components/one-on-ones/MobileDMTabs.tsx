import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfilePopover } from '@/components/UserProfilePopover';
import type { DMConversation } from '@/hooks/useCommunityDMs';

interface MobileDMTabsProps {
  conversations: DMConversation[];
  activeConversationId?: string;
  dmUnreadCounts: Map<string, number>;
  onSelectConversation: (id: string) => void;
  csmUserId?: string | null;
}

export const MobileDMTabs = ({
  conversations,
  activeConversationId,
  dmUnreadCounts,
  onSelectConversation,
  csmUserId,
}: MobileDMTabsProps) => {
  // Pin CSM conversation to top
  const isCsmConv = (c: DMConversation) =>
    !!csmUserId && !c.name && (c.participantCount ?? (c.participants || []).length) === 1 &&
    (c.participants || []).some(p => p.id === csmUserId);
  const sortedConversations = csmUserId
    ? [...conversations].sort((a, b) => (isCsmConv(b) ? 1 : 0) - (isCsmConv(a) ? 1 : 0))
    : conversations;
  return (
    <div className="flex overflow-x-auto gap-2 px-4 py-3 border-b border-border bg-card scrollbar-hide">
      {sortedConversations.map((conv) => {
        const isCsmConversation = isCsmConv(conv);
        const participants = conv.participants || [];
        const isGroup = (conv.participantCount ?? participants.length) > 1;
        const isActive = conv.id === activeConversationId;
        const unreadCount = dmUnreadCounts.get(conv.id) || 0;

        const displayName = conv.name
          ? conv.name
          : isGroup
          ? participants.map(p => `${p.first_name || ''}`.trim() || p.user_email || 'Unknown').join(', ')
          : (() => {
              const p = participants[0];
              const fullName = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : '';
              return fullName || p?.user_email || 'DM';
            })();

        const initials = isGroup
          ? `${participants.length}`
          : (() => {
              const p = participants[0];
              const fullName = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : '';
              return fullName
                ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : displayName.slice(0, 2).toUpperCase();
            })();

        return (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap flex-shrink-0 transition-all",
              isActive
                ? "bg-card shadow-sm border border-border"
                : isCsmConversation
                ? "bg-primary/10 border border-primary/30"
                : "bg-transparent hover:bg-muted"
            )}
          >
            {isGroup ? (
              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                {participants.length}
              </div>
            ) : (
              <UserProfilePopover userId={participants[0]?.id || ''}>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={participants[0]?.avatar_url || undefined} />
                  <AvatarFallback className="text-[8px]">{initials}</AvatarFallback>
                </Avatar>
              </UserProfilePopover>
            )}
            <span className={cn(
              "text-sm font-medium max-w-[120px] truncate",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}>
              {displayName}
            </span>

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
