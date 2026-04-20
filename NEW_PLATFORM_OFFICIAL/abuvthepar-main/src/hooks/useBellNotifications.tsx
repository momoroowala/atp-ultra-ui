import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useState } from 'react';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { differenceInDays, isPast, isToday, isTomorrow, parseISO } from 'date-fns';

const BELL_LAST_READ_KEY = 'bell-last-read-at';
const CSM_DIGEST_READ_KEY = 'csm-digest-last-read-date';

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

export interface BellCSMDigest {
  id: string;
  created_at: string;
  neverLoggedInCount: number;
  doaCount: number;
  atRiskCount: number;
  totalCount: number;
  isRead: boolean;
}

export interface BellActionItemReminder {
  id: string;
  text: string;
  student_name: string;
  due_date: string;
  urgency: 'overdue' | 'due_today' | 'due_tomorrow';
}

export function useBellNotifications() {
  const { user } = useAuth();
  const { isCSM, isAdmin } = useRoleCheck();
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
        .select('id, content, created_at, dm_conversation_id, sender_id, sender:user_profiles!community_messages_sender_id_fkey(first_name, last_name)')
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

      return deduped.map((m: any) => {
        const sender = m.sender as any;
        const senderName = sender
          ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || 'User'
          : 'User';
        return {
          id: m.id,
          content: m.content?.slice(0, 80) || '',
          created_at: m.created_at,
          dm_conversation_id: m.dm_conversation_id,
          sender_name: senderName,
          isRead: m.created_at <= lastReadAt,
        };
      });
    },
    enabled: !!user && myConversationIds.length > 0,
    refetchInterval: 30000,
  });

  // CSM daily digest
  const todayStr = new Date().toDateString();
  const digestReadDate = typeof window !== 'undefined' ? localStorage.getItem(CSM_DIGEST_READ_KEY) : null;
  const isDigestRead = digestReadDate === todayStr;

  const { data: csmDigest } = useQuery({
    queryKey: ['bell-csm-digest', user?.id, todayStr],
    queryFn: async (): Promise<BellCSMDigest | null> => {
      if (!user) return null;

      // Fetch assigned students (direct + delegation coverage)
      const [directRes, delegationRes] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, is_active, last_active_at')
          .eq('assigned_csm_id', user.id)
          .eq('is_active', true),
        supabase
          .from('csm_delegations')
          .select('original_csm_id')
          .eq('delegate_csm_id', user.id)
          .eq('status', 'active'),
      ]);

      let students = directRes.data || [];

      // Include students from active delegations
      const delegatedCsmIds = (delegationRes.data || []).map((d: any) => d.original_csm_id);
      if (delegatedCsmIds.length > 0) {
        const { data: delegatedStudents } = await supabase
          .from('user_profiles')
          .select('id, is_active, last_active_at')
          .in('assigned_csm_id', delegatedCsmIds)
          .eq('is_active', true);
        if (delegatedStudents) {
          const existingIds = new Set(students.map((s: any) => s.id));
          students = [...students, ...delegatedStudents.filter((s: any) => !existingIds.has(s.id))];
        }
      }

      if (students.length === 0) return null;

      const studentIds = students.map((s: any) => s.id);

      // Fetch task counts AND course progress in parallel
      const [taskRes, progressRes] = await Promise.all([
        supabase
          .from('task_responses')
          .select('user_id')
          .in('user_id', studentIds),
        supabase
          .from('course_progress')
          .select('user_id')
          .in('user_id', studentIds)
          .eq('completed', true),
      ]);

      const taskCountMap = new Map<string, number>();
      (taskRes.data || []).forEach((t: any) => {
        taskCountMap.set(t.user_id, (taskCountMap.get(t.user_id) || 0) + 1);
      });

      const progressSet = new Set((progressRes.data || []).map((p: any) => p.user_id));

      let neverLoggedInCount = 0;
      let doaCount = 0;
      let atRiskCount = 0;

      students.forEach((s: any) => {
        const lastActive = s.last_active_at;
        const completedTasks = taskCountMap.get(s.id) || 0;
        const hasProgress = progressSet.has(s.id);

        if (!lastActive) {
          neverLoggedInCount++;
        } else if (completedTasks === 0 && !hasProgress) {
          doaCount++;
        } else if (completedTasks > 0 || hasProgress) {
          const daysInactive = differenceInDays(new Date(), new Date(lastActive));
          if (daysInactive >= 7) {
            atRiskCount++;
          }
        }
      });

      const total = neverLoggedInCount + doaCount + atRiskCount;
      if (total === 0) return null;

      return {
        id: `csm-digest-${todayStr}`,
        created_at: new Date().toISOString(),
        neverLoggedInCount,
        doaCount,
        atRiskCount,
        totalCount: total,
        isRead: isDigestRead,
      };
    },
    enabled: !!user && (isCSM || isAdmin),
    refetchInterval: 60000,
    staleTime: 300000,
  });

  // Action item reminders (due today, tomorrow, or overdue)
  const { data: actionItemReminders = [] } = useQuery({
    queryKey: ['bell-action-reminders', user?.id],
    queryFn: async (): Promise<BellActionItemReminder[]> => {
      if (!user) return [];

      const { data: items, error } = await supabase
        .from('client_action_items')
        .select('id, text, client_user_id, due_date')
        .eq('created_by', user.id)
        .eq('is_completed', false)
        .not('due_date', 'is', null);

      if (error || !items || items.length === 0) return [];

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      tomorrow.setHours(0, 0, 0, 0);

      const relevant = (items as any[]).filter(i => {
        const d = new Date(i.due_date + 'T00:00:00');
        return d < tomorrow; // overdue, today, or tomorrow
      });

      if (relevant.length === 0) return [];

      const studentIds = [...new Set(relevant.map(i => i.client_user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('id', studentIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'User'])
      );

      return relevant.map(i => {
        const d = new Date(i.due_date + 'T00:00:00');
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tmrw = new Date(today); tmrw.setDate(tmrw.getDate() + 1);
        let urgency: 'overdue' | 'due_today' | 'due_tomorrow' = 'due_tomorrow';
        if (d < today) urgency = 'overdue';
        else if (d.getTime() === today.getTime()) urgency = 'due_today';

        return {
          id: i.id,
          text: i.text?.slice(0, 60) || '',
          student_name: profileMap.get(i.client_user_id) || 'User',
          due_date: i.due_date,
          urgency,
        };
      });
    },
    enabled: !!user && (isCSM || isAdmin),
    refetchInterval: 60000,
  });

  // Derive unread counts from isRead field using current lastReadAt
  const currentLastRead = lastReadAt;
  const mentionCount = mentions.filter(m => m.created_at > currentLastRead).length;
  const dmCount = allDMs.filter(m => m.created_at > currentLastRead).length;
  const digestUnread = csmDigest && !isDigestRead ? 1 : 0;
  const actionItemReminderCount = actionItemReminders.length;
  const totalCount = mentionCount + dmCount + digestUnread + actionItemReminderCount;

  const markBellRead = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(BELL_LAST_READ_KEY, now);
    setLastReadAt(now);
    // Mark CSM digest as read for today
    localStorage.setItem(CSM_DIGEST_READ_KEY, new Date().toDateString());
    queryClient.invalidateQueries({ queryKey: ['bell-mentions'] });
    queryClient.invalidateQueries({ queryKey: ['bell-unread-dms'] });
    queryClient.invalidateQueries({ queryKey: ['bell-csm-digest'] });
  }, [queryClient]);

  return { mentions, unreadDMs: allDMs, mentionCount, dmCount, totalCount, markBellRead, csmDigest, actionItemReminders };
}
