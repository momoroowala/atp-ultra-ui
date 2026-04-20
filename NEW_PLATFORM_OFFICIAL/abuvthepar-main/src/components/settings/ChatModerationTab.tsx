import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Check, X, Shield, ShieldOff, Flag, Bot, User, MessageSquare } from 'lucide-react';
import { useChatModeration, FlaggedMessage, BlockedUser } from '@/hooks/useChatModeration';
import { useAllUsers } from '@/hooks/useAllUsers';
import { formatDistanceToNow } from 'date-fns';

export const ChatModerationTab = () => {
  const {
    flaggedMessages,
    flaggedMessagesLoading,
    blockedUsers,
    blockedUsersLoading,
    releaseMessage,
    rejectMessage,
    blockUser,
    unblockUser,
  } = useChatModeration();

  const { data: allUsers } = useAllUsers();
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [userSearch, setUserSearch] = useState('');

  const handleBlockUser = () => {
    if (!selectedUserId || !blockReason.trim()) return;
    blockUser.mutate(
      { userId: selectedUserId, reason: blockReason },
      {
        onSuccess: () => {
          setShowBlockModal(false);
          setSelectedUserId('');
          setBlockReason('');
        },
      }
    );
  };

  const filteredUsers = allUsers?.filter(u => {
    if (!userSearch) return true;
    const name = `${u.first_name || ''} ${u.last_name || ''} ${u.user_email || ''}`.toLowerCase();
    return name.includes(userSearch.toLowerCase());
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Chat Moderation</h2>
        <p className="text-sm text-muted-foreground">
          Review flagged messages and manage blocked users
        </p>
      </div>

      <Tabs defaultValue="flagged" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="flagged" className="gap-2">
            <Flag className="h-4 w-4" />
            Flagged Messages
            {flaggedMessages.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {flaggedMessages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="blocked" className="gap-2">
            <Shield className="h-4 w-4" />
            Blocked Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flagged" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Messages Pending Review</CardTitle>
              <CardDescription>
                Messages flagged by AI or reported by users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flaggedMessagesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : flaggedMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No flagged messages to review</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4 pr-4">
                    {flaggedMessages.map((msg) => (
                      <FlaggedMessageCard
                        key={msg.id}
                        message={msg}
                        onRelease={() => releaseMessage.mutate(msg.id)}
                        onReject={() => rejectMessage.mutate(msg.id)}
                        onBlockUser={(userId) => {
                          setSelectedUserId(userId);
                          setShowBlockModal(true);
                        }}
                        isLoading={releaseMessage.isPending || rejectMessage.isPending}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Blocked Users</CardTitle>
                <CardDescription>
                  Users blocked from sending messages in community chat
                </CardDescription>
              </div>
              <Button onClick={() => setShowBlockModal(true)}>
                <Shield className="h-4 w-4 mr-2" />
                Block User
              </Button>
            </CardHeader>
            <CardContent>
              {blockedUsersLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : blockedUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No blocked users</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 pr-4">
                    {blockedUsers.map((blocked) => (
                      <BlockedUserCard
                        key={blocked.id}
                        blocked={blocked}
                        onUnblock={() => unblockUser.mutate(blocked.user_id)}
                        isLoading={unblockUser.isPending}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Block User Modal */}
      <Dialog open={showBlockModal} onOpenChange={setShowBlockModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Block User</DialogTitle>
            <DialogDescription>
              Blocked users cannot send messages in community channels or DMs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Search User</Label>
              <Input
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            {userSearch && (
              <ScrollArea className="h-40 border rounded-md">
                <div className="p-2 space-y-1">
                  {filteredUsers.slice(0, 10).map((u) => {
                    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown';
                    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                    const isSelected = selectedUserId === u.id;

                    return (
                      <div
                        key={u.id}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedUserId(u.id)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.user_email}</p>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
            <div>
              <Label>Reason for blocking</Label>
              <Input
                placeholder="Enter reason..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockUser}
              disabled={!selectedUserId || !blockReason.trim() || blockUser.isPending}
            >
              Block User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Subcomponent for flagged message card
const FlaggedMessageCard = ({
  message,
  onRelease,
  onReject,
  onBlockUser,
  isLoading,
}: {
  message: FlaggedMessage;
  onRelease: () => void;
  onReject: () => void;
  onBlockUser: (userId: string) => void;
  isLoading: boolean;
}) => {
  const senderName = message.sender
    ? `${message.sender.first_name || ''} ${message.sender.last_name || ''}`.trim() || 'Unknown'
    : 'Unknown';
  const initials = senderName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={message.sender?.avatar_url || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{senderName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              {message.channel && ` • #${message.channel.name}`}
            </p>
          </div>
        </div>
        <Badge variant={message.ai_flagged ? 'secondary' : 'outline'} className="gap-1">
          {message.ai_flagged ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
          {message.ai_flagged ? 'AI Flagged' : 'User Report'}
        </Badge>
      </div>

      <div className="bg-muted rounded-md p-3">
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>

      {message.flag_reason && (
        <p className="text-sm text-destructive">
          <strong>Reason:</strong> {message.flag_reason}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onRelease}
          disabled={isLoading}
          className="gap-1"
        >
          <Check className="h-4 w-4" />
          Release
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onReject}
          disabled={isLoading}
          className="gap-1"
        >
          <X className="h-4 w-4" />
          Reject
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" className="ml-auto gap-1">
              <Shield className="h-4 w-4" />
              Block User
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Block this user?</AlertDialogTitle>
              <AlertDialogDescription>
                This will prevent {senderName} from sending any messages in community chat.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onBlockUser(message.sender_id)}>
                Block
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

// Subcomponent for blocked user card
const BlockedUserCard = ({
  blocked,
  onUnblock,
  isLoading,
}: {
  blocked: BlockedUser;
  onUnblock: () => void;
  isLoading: boolean;
}) => {
  const userName = blocked.user
    ? `${blocked.user.first_name || ''} ${blocked.user.last_name || ''}`.trim() || 'Unknown'
    : 'Unknown';
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg">
      <Avatar className="h-10 w-10">
        <AvatarImage src={blocked.user?.avatar_url || undefined} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{userName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {blocked.user?.user_email}
        </p>
        <p className="text-xs text-destructive mt-1">
          Reason: {blocked.reason}
        </p>
        <p className="text-xs text-muted-foreground">
          Blocked {formatDistanceToNow(new Date(blocked.blocked_at), { addSuffix: true })}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onUnblock}
        disabled={isLoading}
        className="gap-1"
      >
        <ShieldOff className="h-4 w-4" />
        Unblock
      </Button>
    </div>
  );
};
