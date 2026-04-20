import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useCommunityDMs } from '@/hooks/useCommunityDMs';
import { X, MessageCircle, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useUserTier } from '@/hooks/useUserTier';

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  user_email: string | null;
}

interface StartDMModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StartDMModal = ({ open, onOpenChange }: StartDMModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isCSM, isExecutive } = useRoleCheck();
  const { tierKey } = useUserTier();
  const isStaff = isAdmin || isCSM || isExecutive;
  const isHighTier = tierKey === 'platinum' || tierKey === 'diamond';
  const { createOrGetDM, createGroupDM } = useCommunityDMs();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelectedUsers([]);
      setGroupName('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const searchUsers = async () => {
      setIsLoading(true);
      try {
        // Get admin role IDs to filter them out (for non-staff users)
        const { data: roles } = await supabase
          .from('roles')
          .select('id, role_key');

        const adminRoleIds = (roles || [])
          .filter(r => ['admin', 'csm', 'csa', 'executive'].includes(r.role_key))
          .map(r => r.id);

        // If current user is Platinum/Diamond, fetch peer high-tier user IDs
        let highTierUserIds: string[] = [];
        if (!isStaff && isHighTier) {
          const { data: tiers } = await supabase
            .from('tiers')
            .select('id')
            .in('tier_key', ['platinum', 'diamond']);

          const highTierIds = (tiers || []).map(t => t.id);

          if (highTierIds.length > 0) {
            const { data: profiles } = await supabase
              .from('user_profiles')
              .select('id')
              .in('tier_id', highTierIds)
              .neq('id', user?.id || '');

            highTierUserIds = (profiles || []).map(p => p.id);
          }
        }

        let query = supabase
          .from('user_public_profiles')
          .select('id, first_name, last_name, avatar_url, role_id, user_email')
          .neq('id', user?.id || '')
          .eq('is_active', true)
          .limit(50);

        if (search) {
          query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,user_email.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        const BLOCKED_DM_EMAILS = ['tayeb@abuvthepar.com', 'stemar@abuvthepar.com'];

        let filteredUsers: typeof data;
        if (isStaff) {
          // Staff can see everyone
          filteredUsers = data || [];
        } else if (isHighTier) {
          // Platinum/Diamond clients can see staff + other Platinum/Diamond clients
          filteredUsers = (data || []).filter(u =>
            adminRoleIds.includes(u.role_id as string) || highTierUserIds.includes(u.id)
          );
        } else {
          // Other tiers can only see staff
          filteredUsers = (data || []).filter(u => adminRoleIds.includes(u.role_id as string));
        }

        const finalUsers = filteredUsers.filter(
          u => !BLOCKED_DM_EMAILS.includes((u.user_email || '').toLowerCase())
        );

        setUsers(finalUsers.map(u => ({
          id: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          avatar_url: u.avatar_url,
          user_email: u.user_email,
        })));
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [search, open, user?.id, isStaff, isHighTier]);

  const toggleUser = (u: User) => {
    setSelectedUsers(prev =>
      prev.some(s => s.id === u.id)
        ? prev.filter(s => s.id !== u.id)
        : [...prev, u]
    );
  };

  const removeSelected = (id: string) => {
    setSelectedUsers(prev => prev.filter(s => s.id !== id));
  };

  const handleStartConversation = () => {
    if (selectedUsers.length === 0) return;

    if (selectedUsers.length === 1) {
      // Single DM - reuse existing
      createOrGetDM.mutate(selectedUsers[0].id, {
        onSuccess: (result) => {
          onOpenChange(false);
          navigate(`/1on1s/${result.id}`);
        },
      });
    } else {
      // Group DM - always create new
      createGroupDM.mutate({ userIds: selectedUsers.map(u => u.id), name: groupName || undefined }, {
        onSuccess: (result) => {
          onOpenChange(false);
          navigate(`/1on1s/${result.id}`);
        },
      });
    }
  };

  const isPending = createOrGetDM.isPending || createGroupDM.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden [&>button:last-child]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Start A Conversation</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Selected Users Chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(u => {
                const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.user_email || 'Unknown';
                return (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary text-sm px-2.5 py-1 rounded-full"
                  >
                    {name}
                    <button
                      onClick={() => removeSelected(u.id)}
                      className="hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Group Name Input */}
          {selectedUsers.length > 1 && (
            <Input
              placeholder="Group name (optional)"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="h-11"
            />
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 pl-10"
            />
          </div>

          {/* User List */}
          <ScrollArea className="h-64">
            <div className="space-y-1">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-4">Searching...</p>
              ) : users.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No users found</p>
              ) : (
                users.map((u) => {
                  const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.user_email || 'Unknown User';
                  const initials = u.first_name && u.last_name 
                    ? `${u.first_name[0]}${u.last_name[0]}`.toUpperCase()
                    : name.slice(0, 2).toUpperCase();
                  const isSelected = selectedUsers.some(s => s.id === u.id);

                  return (
                    <div
                      key={u.id}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5' : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleUser(u)}
                    >
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 font-medium text-foreground">{name}</span>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Start Conversation Button */}
          <Button
            onClick={handleStartConversation}
            disabled={selectedUsers.length === 0 || isPending}
            className="w-full h-11 text-white"
            style={{ background: 'radial-gradient(160.59% 161.46% at 50% 0%, #2D8F64 0%, #6EDAA6 100%), #55BD8A' }}
          >
            {isPending
              ? 'Creating...'
              : selectedUsers.length <= 1
                ? 'Start Conversation'
                : `Start Group Conversation (${selectedUsers.length})`
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
