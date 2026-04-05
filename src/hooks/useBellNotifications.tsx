import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useState } from 'react';

const BELL_LAST_READ_KEY = 'bell-last-read-at';

function getLastBellReadAt(): string {
  return localStorage.getItem(BELL_LAST_READ_KEY) || new Date(0).toISOString();
}

export interface BellMention {
  id: string;
  content: string;
  created_at: string;
  channel_id: string;
  channel_name: string;
  sender_name: string;
  isRead: boolean;
}

export interface BellDM {
  id: string;
  content: string;
  created_at: string;
  dm_conversation_id: string;
  sender_name: string;
  isRead: boolean;
}

export function useBellNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [lastReadAt, setLastReadAt] = useState(getLastBellReadAt);

  // Fetch recent mentions (no longer filtered by lastReadAt)
  const { data: mentions = [] } = useQuery({
    queryKey: ['bell-mentions', user?.id],
    queryFn: async (): Promise<BellMention[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('community_messages')
        .select('id, content, created_at, channel_id, sender_id, community_channels(name)')
        .contains('mentions', [user.id])
        .eq('is_deleted', false)
        .not('channel_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error || !data) return [];

      const senderIds = [...new Set(data.map((m: any) => m.sender_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('id', senderIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'User'])
      );

      return data.map((m: any) => ({
        id: m.id,
        content: m.content?.slice(0, 80) || '',
        created_at: m.created_at,
        channel_id: m.channel_id,
        channel_name: (m.community_channels as any)?.name || 'channel',
        sender_name: profileMap.get(m.sender_id) || 'User',
        isRead: m.created_at <= lastReadAt,
      }));
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch user's DM conversation IDs
  const { data: myConversationIds = [] } = useQuery({
    queryKey: ['bell-dm-conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('community_dm_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch recent DMs (no longer filtered by lastReadAt)
  const { data: allDMs = [] } = useQuery({
    queryKey: ['bell-unread-dms', user?.id, myConversationIds],
    queryFn: async (): Promise<BellDM[]> => {
      if (!user || myConversationIds.length === 0) return [];
      const convIds = myConversationIds.map((c: any) => c.conversation_id);
      
      const { data, error } = await supabase
        .from('community_messages')
        .select('id, content, created_at, dm_conversation_id, sender_id')
        .in('dm_conversation_id', convIds)
        .neq('sender_id', user.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error || !data) return [];

      // Deduplicate by conversation — keep latest per conversation
      const seenConvs = new Set<string>();
      const deduped = data.filter((m: any) => {
        if (seenConvs.has(m.dm_conversation_id)) return false;
        seenConvs.add(m.dm_conversation_id);
        return true;
      }).slice(0, 5);

      const senderIds = [...new Set(deduped.map((m: any) => m.sender_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('id', senderIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'User'])
      );

      return deduped.map((m: any) => ({
        id: m.id,
        content: m.content?.slice(0, 80) || '',
        created_at: m.created_at,
        dm_conversation_id: m.dm_conversation_id,
        sender_name: profileMap.get(m.sender_id) || 'User',
        isRead: m.created_at <= lastReadAt,
      }));
    },
    enabled: !!user && myConversationIds.length > 0,
    refetchInterval: 30000,
  });

  // Derive unread counts from isRead field using current lastReadAt
  const currentLastRead = lastReadAt;
  const mentionCount = mentions.filter(m => m.created_at > currentLastRead).length;
  const dmCount = allDMs.filter(m => m.created_at > currentLastRead).length;
  const totalCount = mentionCount + dmCount;

  const markBellRead = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(BELL_LAST_READ_KEY, now);
    setLastReadAt(now);
    queryClient.invalidateQueries({ queryKey: ['bell-mentions'] });
    queryClient.invalidateQueries({ queryKey: ['bell-unread-dms'] });
  }, [queryClient]);

  return { mentions, unreadDMs: allDMs, mentionCount, dmCount, totalCount, markBellRead };
}
