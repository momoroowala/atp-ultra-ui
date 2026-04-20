import { useState } from 'react';
import { Plus, MessageCircle, Trash2, Pencil, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { StartDMModal } from '@/components/community/StartDMModal';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { UserProfilePopover } from '@/components/UserProfilePopover';
import type { DMConversation } from '@/hooks/useCommunityDMs';

interface DMSidebarProps {
  conversations: DMConversation[];
  activeConversationId?: string;
  dmUnreadCounts: Map<string, number>;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onRenameConversation?: (id: string, name: string) => void;
  csmUserId?: string | null;
  isLoading: boolean;
}

export const DMSidebar = ({
  conversations,
  activeConversationId,
  dmUnreadCounts,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  csmUserId,
  isLoading,
}: DMSidebarProps) => {
  const { isAdmin, isCSM, isExecutive } = useRoleCheck();
  const isStaff = isAdmin || isCSM || isExecutive;
  const [showStartDM, setShowStartDM] = useState(false);
  const [deletingConvId, setDeletingConvId] = useState<string | null>(null);
  const [renamingConv, setRenamingConv] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
        <MessageCircle className="h-6 w-6 text-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Direct Messages</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Direct Messages
              </span>
              {isStaff && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowStartDM(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            {/* Search bar */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="h-8 pl-8 pr-3 text-sm py-1"
              />
            </div>
            <div className="space-y-0.5">
              {(() => {
                // Pin CSM conversation to top
                const isCsmConv = (c: DMConversation) =>
                  !!csmUserId && !c.name && (c.participantCount ?? (c.participants || []).length) === 1 &&
                  (c.participants || []).some(p => p.id === csmUserId);
                const sorted = [...conversations].sort((a, b) => {
                  // 1. Pin CSM conversation
                  if (csmUserId) {
                    const csmA = isCsmConv(a) ? 1 : 0;
                    const csmB = isCsmConv(b) ? 1 : 0;
                    if (csmB !== csmA) return csmB - csmA;
                  }
                  // 2. Unread on top
                  const unreadA = (dmUnreadCounts.get(a.id) || 0) > 0 ? 1 : 0;
                  const unreadB = (dmUnreadCounts.get(b.id) || 0) > 0 ? 1 : 0;
                  if (unreadB !== unreadA) return unreadB - unreadA;
                  // 3. Most recent first
                  return new Date(b.last_message_at || b.created_at || 0).getTime() - new Date(a.last_message_at || a.created_at || 0).getTime();
                });
                return sorted;
              })().filter((conv) => {
                if (!searchQuery.trim()) return true;
                const participants = conv.participants || [];
                const isGroup = (conv.participantCount ?? participants.length) > 1;
                const displayName = conv.name
                  ? conv.name
                  : isGroup
                  ? participants.map(p => `${p.first_name || ''}`.trim() || p.user_email || 'Unknown').join(', ')
                  : (() => {
                      const p = participants[0];
                      const fullName = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : '';
                      return fullName || p?.user_email || 'Unknown User';
                    })();
                return displayName.toLowerCase().includes(searchQuery.toLowerCase());
              }).map((conv) => {
                const isCsmConversation = !!csmUserId && !conv.name &&
                  (conv.participantCount ?? (conv.participants || []).length) === 1 &&
                  (conv.participants || []).some(p => p.id === csmUserId);
                const participants = conv.participants || [];
                const isGroup = (conv.participantCount ?? participants.length) > 1;
                const displayName = conv.name
                  ? conv.name
                  : isGroup
                  ? participants.map(p => `${p.first_name || ''}`.trim() || p.user_email || 'Unknown').join(', ')
                  : (() => {
                      const p = participants[0];
                      const fullName = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : '';
                      return fullName || p?.user_email || 'Unknown User';
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
                const unreadCount = dmUnreadCounts.get(conv.id) || 0;
                const isActive = activeConversationId === conv.id;

                return (
                  <div
                    key={conv.id}
                    className={`
                      group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer
                      transition-colors min-h-[36px]
                      ${isCsmConversation ? 'border-l-2 border-l-primary bg-primary/5' : ''}
                      ${isActive
                        ? 'bg-card shadow-sm border border-border'
                        : isCsmConversation ? '' : 'hover:bg-muted'
                      }
                    `}
                    onClick={() => onSelectConversation(conv.id)}
                  >
                    {isGroup ? (
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {participants.length}
                      </div>
                    ) : (
                      <UserProfilePopover userId={participants[0]?.id || ''}>
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={participants[0]?.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                        </Avatar>
                      </UserProfilePopover>
                    )}
                    <span className={`flex-1 truncate text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {displayName}
                    </span>
                    {isCsmConversation && (
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        Your CSM
                      </span>
                    )}
                    {unreadCount > 0 && !isActive && (
                      <span
                        className="text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center"
                        style={{ background: 'radial-gradient(160.59% 161.46% at 50% 0%, #2D8F64 0%, #6EDAA6 100%), #55BD8A' }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    {isStaff && isGroup && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 transition-opacity text-muted-foreground hover:text-foreground ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingConv({ id: conv.id, name: conv.name || '' });
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {isStaff && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 transition-opacity text-muted-foreground hover:text-destructive ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingConvId(conv.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
              {conversations.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-2">
                  No conversations yet
                </p>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Modals */}
      <StartDMModal
        open={showStartDM}
        onOpenChange={setShowStartDM}
      />

      {/* Delete DM Confirmation */}
      <AlertDialog open={!!deletingConvId} onOpenChange={(open) => !open && setDeletingConvId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              All messages will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingConvId && onDeleteConversation) {
                  onDeleteConversation(deletingConvId);
                }
                setDeletingConvId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Group Dialog */}
      <Dialog open={!!renamingConv} onOpenChange={(open) => !open && setRenamingConv(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Group</DialogTitle>
          </DialogHeader>
          <Input
            value={renamingConv?.name || ''}
            onChange={(e) => setRenamingConv(prev => prev ? { ...prev, name: e.target.value } : null)}
            placeholder="Group name..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenamingConv(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (renamingConv && onRenameConversation) {
                  onRenameConversation(renamingConv.id, renamingConv.name);
                }
                setRenamingConv(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
