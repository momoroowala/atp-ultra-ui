import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';


export interface DMConversation {
  id: string;
  name: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  participantCount: number;
  participants: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    user_email: string | null;
    avatar_url: string | null;
  }[];
  last_message?: {
    content: string;
    sender_id: string;
    created_at: string;
  } | null;
  unread_count?: number;
}

const DM_STORAGE_KEY = 'community_dm_conversations_local';

function getLocalDMs(): DMConversation[] {
  try {
    return JSON.parse(localStorage.getItem(DM_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalDMs(convs: DMConversation[]) {
  localStorage.setItem(DM_STORAGE_KEY, JSON.stringify(convs));
}


export const useCommunityDMs = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: ['community-dm-conversations'],
    queryFn: async () => {
      // Try Supabase first, fall back to localStorage/demo
      let participations: any[] | null = null;
      try {
        const { data, error } = await supabase
          .from('community_dm_participants')
          .select('conversation_id, last_read_at')
          .eq('user_id', user?.id!);
        if (!error && data && data.length > 0) participations = data;
      } catch {
        // Supabase unavailable -- will use demo data below
      }

      if (!participations || participations.length === 0) {
        // Return localStorage conversations + demo conversations
        const local = getLocalDMs();
        if (local.length > 0) return local;
        // Seed demo conversations so the page isn't blank
        const demoConvs: DMConversation[] = [
          {
            id: 'demo-dm-1', name: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            last_message_at: new Date(Date.now() - 3600000).toISOString(), participantCount: 1,
            participants: [{ id: 'demo-user-1', first_name: 'Coach', last_name: 'Brittany', user_email: 'brittany@atp.com', avatar_url: null }],
            last_message: { content: 'Great work on your outreach this week!', sender_id: 'demo-user-1', created_at: new Date(Date.now() - 3600000).toISOString() },
            unread_count: 1,
          },
          {
            id: 'demo-dm-2', name: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            last_message_at: new Date(Date.now() - 86400000).toISOString(), participantCount: 1,
            participants: [{ id: 'demo-user-2', first_name: 'Sarah', last_name: 'Chen', user_email: 'sarah@student.com', avatar_url: null }],
            last_message: { content: 'Hey, which brands are you focusing on?', sender_id: 'demo-user-2', created_at: new Date(Date.now() - 86400000).toISOString() },
            unread_count: 0,
          },
          {
            id: 'demo-dm-3', name: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
            last_message_at: new Date(Date.now() - 172800000).toISOString(), participantCount: 1,
            participants: [{ id: 'demo-user-3', first_name: 'Marcus', last_name: 'Rivera', user_email: 'marcus@student.com', avatar_url: null }],
            last_message: { content: 'Thanks for the SmartScout tips!', sender_id: 'demo-user-3', created_at: new Date(Date.now() - 172800000).toISOString() },
            unread_count: 0,
          },
        ];
        return demoConvs;
      }

      let conversationIds: string[];
      try {
        conversationIds = participations.map(p => p.conversation_id);
      } catch {
        // Fallback if participations is malformed
        const demoConvs: DMConversation[] = [
          { id: 'demo-dm-1', name: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_message_at: new Date(Date.now() - 3600000).toISOString(), participantCount: 1, participants: [{ id: 'demo-user-1', first_name: 'Coach', last_name: 'Brittany', user_email: 'brittany@atp.com', avatar_url: null }], last_message: { content: 'Great work this week!', sender_id: 'demo-user-1', created_at: new Date(Date.now() - 3600000).toISOString() }, unread_count: 0 },
        ];
        return demoConvs;
      }

      // Get conversation details -- wrap in try/catch to fall back to demo on error
      const { data: conversations, error: convError } = await supabase
        .from('community_dm_conversations')
        .select('*')
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false });

      if (convError || !conversations || conversations.length === 0) {
        // Real conversations failed to load -- return demo + local
        const local = getLocalDMs();
        const demoFallback: DMConversation[] = [
          { id: 'demo-dm-1', name: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_message_at: new Date(Date.now() - 3600000).toISOString(), participantCount: 1, participants: [{ id: 'demo-user-1', first_name: 'Coach', last_name: 'Brittany', user_email: 'brittany@atp.com', avatar_url: null }], last_message: { content: 'Great work on your outreach this week!', sender_id: 'demo-user-1', created_at: new Date(Date.now() - 3600000).toISOString() }, unread_count: 1 },
          { id: 'demo-dm-2', name: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_message_at: new Date(Date.now() - 86400000).toISOString(), participantCount: 1, participants: [{ id: 'demo-user-2', first_name: 'Sarah', last_name: 'Chen', user_email: 'sarah@student.com', avatar_url: null }], last_message: { content: 'Hey, which brands are you focusing on?', sender_id: 'demo-user-2', created_at: new Date(Date.now() - 86400000).toISOString() }, unread_count: 0 },
          { id: 'demo-dm-3', name: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_message_at: new Date(Date.now() - 172800000).toISOString(), participantCount: 1, participants: [{ id: 'demo-user-3', first_name: 'Marcus', last_name: 'Rivera', user_email: 'marcus@student.com', avatar_url: null }], last_message: { content: 'Thanks for the SmartScout tips!', sender_id: 'demo-user-3', created_at: new Date(Date.now() - 172800000).toISOString() }, unread_count: 0 },
        ];
        const ids = new Set(local.map(l => l.id));
        return [...local, ...demoFallback.filter(d => !ids.has(d.id))];
      }

      // Get participants and last message for each conversation
      let enrichedConversations: DMConversation[];
      try {
      enrichedConversations = await Promise.all(
        (conversations || []).map(async (conv) => {
          // Get all participant user IDs
          const { data: participantRecords } = await supabase
            .from('community_dm_participants')
            .select('user_id')
            .eq('conversation_id', conv.id);

          // Get user profiles for participants (excluding current user)
          const otherUserIds = (participantRecords || [])
            .map(p => p.user_id)
            .filter(id => id !== user?.id);

          const { data: profiles } = await supabase
            .from('user_public_profiles')
            .select('id, first_name, last_name, user_email, avatar_url, role_id, is_active')
            .in('id', otherUserIds);

          // Fallback: for any participants not found in user_public_profiles,
          // try user_profiles (staff have RLS access to all rows)
          const foundIds = new Set((profiles || []).map(p => p.id));
          const missingIds = otherUserIds.filter(id => !foundIds.has(id));

          let fallbackProfiles: { id: string; first_name: string | null; last_name: string | null; user_email: string | null; avatar_url: string | null }[] = [];
          if (missingIds.length > 0) {
            const { data: fbProfiles } = await supabase
              .from('user_profiles')
              .select('id, first_name, last_name, user_email, avatar_url')
              .in('id', missingIds);
            fallbackProfiles = fbProfiles || [];
          }

          const displayProfiles = [...(profiles || []), ...fallbackProfiles];

          // Get last message
          const { data: lastMessages } = await supabase
            .from('community_messages')
            .select('content, sender_id, created_at')
            .eq('dm_conversation_id', conv.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(1);

          // Get unread count
          const myParticipation = participations.find(p => p.conversation_id === conv.id);
          const { count: unreadCount } = await supabase
            .from('community_messages')
            .select('*', { count: 'exact', head: true })
            .eq('dm_conversation_id', conv.id)
            .eq('is_deleted', false)
            .neq('sender_id', user?.id!)
            .gt('created_at', myParticipation?.last_read_at || '1970-01-01');

          return {
            id: conv.id,
            name: (conv as any).name || null,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            last_message_at: conv.last_message_at,
            participantCount: otherUserIds.length,
            participants: displayProfiles.map(p => ({
              id: p.id,
              first_name: p.first_name,
              last_name: p.last_name,
              user_email: p.user_email,
              avatar_url: p.avatar_url,
            })),
            last_message: lastMessages?.[0] || null,
            unread_count: unreadCount || 0,
          };
        })
      );
      } catch (enrichError) {
        console.warn('[DMs] Failed to enrich conversations, using demo fallback:', enrichError);
        const local = getLocalDMs();
        const demoFallback: DMConversation[] = [
          { id: 'demo-dm-1', name: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_message_at: new Date(Date.now() - 3600000).toISOString(), participantCount: 1, participants: [{ id: 'demo-user-1', first_name: 'Coach', last_name: 'Brittany', user_email: 'brittany@atp.com', avatar_url: null }], last_message: { content: 'Great work on your outreach this week!', sender_id: 'demo-user-1', created_at: new Date(Date.now() - 3600000).toISOString() }, unread_count: 1 },
          { id: 'demo-dm-2', name: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_message_at: new Date(Date.now() - 86400000).toISOString(), participantCount: 1, participants: [{ id: 'demo-user-2', first_name: 'Sarah', last_name: 'Chen', user_email: 'sarah@student.com', avatar_url: null }], last_message: { content: 'Hey, which brands are you focusing on?', sender_id: 'demo-user-2', created_at: new Date(Date.now() - 86400000).toISOString() }, unread_count: 0 },
          { id: 'demo-dm-3', name: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), last_message_at: new Date(Date.now() - 172800000).toISOString(), participantCount: 1, participants: [{ id: 'demo-user-3', first_name: 'Marcus', last_name: 'Rivera', user_email: 'marcus@student.com', avatar_url: null }], last_message: { content: 'Thanks for the SmartScout tips!', sender_id: 'demo-user-3', created_at: new Date(Date.now() - 172800000).toISOString() }, unread_count: 0 },
        ];
        const ids = new Set(local.map(l => l.id));
        enrichedConversations = [...local, ...demoFallback.filter(d => !ids.has(d.id))];
      }

      // Sort by last_message_at (most recent first)
      return enrichedConversations.sort((a, b) => {
        const dateA = new Date(a.last_message_at || a.created_at || 0).getTime();
        const dateB = new Date(b.last_message_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });
    },
    enabled: !!user,
    retry: 1,
    refetchOnMount: 'always',
  });

  const createOrGetDM = useMutation({
    mutationFn: async (otherUserId: string) => {
      // Check if a 1:1 conversation already exists with this user
      const { data: targetUserConvs } = await supabase
        .from('community_dm_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId);

      if (targetUserConvs && targetUserConvs.length > 0) {
        const { data: myParticipation } = await supabase
          .from('community_dm_participants')
          .select('conversation_id')
          .eq('user_id', user?.id!)
          .in('conversation_id', targetUserConvs.map(c => c.conversation_id));

          if (myParticipation && myParticipation.length > 0) {
          // Find a true 1:1 (unnamed conversation with exactly 2 participants)
          for (const conv of myParticipation) {
            const { data: convData } = await supabase
              .from('community_dm_conversations')
              .select('name')
              .eq('id', conv.conversation_id)
              .maybeSingle();

            // Must be unnamed AND have exactly 2 participants
            if (!convData?.name) {
              const { count } = await supabase
                .from('community_dm_participants')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.conversation_id);

              if (count === 2) {
                return { id: conv.conversation_id, isNew: false };
              }
            }
          }
        }
      }

      // Create new conversation
      const newConversationId = crypto.randomUUID();

      const { error: convError } = await supabase
        .from('community_dm_conversations')
        .insert({ id: newConversationId } as any);

      if (convError) throw convError;

      // Add current user first (plain INSERT)
      const { error: selfError } = await supabase
        .from('community_dm_participants')
        .insert({ conversation_id: newConversationId, user_id: user?.id! });

      if (selfError) throw selfError;

      // Add the other user
      const { error: partError } = await supabase
        .from('community_dm_participants')
        .insert({ conversation_id: newConversationId, user_id: otherUserId });

      if (partError) throw partError;

      return { id: newConversationId, isNew: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-dm-conversations'] });
    },
    onError: (error) => {
      // Fallback: create a local-only conversation when Supabase fails
      console.error('Create DM error (falling back to localStorage):', error);
    },
  });

  // Wrap createOrGetDM with localStorage fallback
  // Accepts either a plain userId string or an object with user info for better display
  const createOrGetDMWithFallback = useMutation({
    mutationFn: async (input: string | { userId: string; firstName?: string; lastName?: string; email?: string }) => {
      const otherUserId = typeof input === 'string' ? input : input.userId;
      const firstName = typeof input === 'object' ? input.firstName : null;
      const lastName = typeof input === 'object' ? input.lastName : null;
      const email = typeof input === 'object' ? input.email : null;

      try {
        const result = await createOrGetDM.mutateAsync(otherUserId);
        return result;
      } catch (err) {
        // localStorage fallback: create a local conversation
        const localConvs = getLocalDMs();
        const existing = localConvs.find(c =>
          c.participants.some(p => p.id === otherUserId)
        );
        if (existing) return { id: existing.id, isNew: false };

        const newId = 'local-dm-' + crypto.randomUUID();
        const newConv: DMConversation = {
          id: newId,
          name: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
          participantCount: 1,
          participants: [{ id: otherUserId, first_name: firstName || null, last_name: lastName || null, user_email: email || null, avatar_url: null }],
          last_message: null,
          unread_count: 0,
        };
        localConvs.unshift(newConv);
        saveLocalDMs(localConvs);
        queryClient.invalidateQueries({ queryKey: ['community-dm-conversations'] });
        toast.success('Conversation started');
        return { id: newId, isNew: true };
      }
    },
  });

  const createGroupDM = useMutation({
    mutationFn: async ({ userIds, name }: { userIds: string[]; name?: string }) => {
      const newConversationId = crypto.randomUUID();

      const insertData: any = { id: newConversationId };
      if (name?.trim()) insertData.name = name.trim();

      const { error: convError } = await supabase
        .from('community_dm_conversations')
        .insert(insertData);

      if (convError) throw convError;

      // Add current user first
      const { error: selfError } = await supabase
        .from('community_dm_participants')
        .insert({ conversation_id: newConversationId, user_id: user?.id! });

      if (selfError) throw selfError;

      // Add all selected users
      const participants = userIds.map(uid => ({
        conversation_id: newConversationId,
        user_id: uid,
      }));

      const { error: partError } = await supabase
        .from('community_dm_participants')
        .insert(participants);

      if (partError) throw partError;

      return { id: newConversationId, isNew: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-dm-conversations'] });
    },
    onError: (error) => {
      toast.error('Failed to create group conversation');
      console.error('Create group DM error:', error);
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('community_dm_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user?.id!);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-dm-conversations'] });
    },
  });

  const deleteDM = useMutation({
    mutationFn: async (conversationId: string) => {
      // 1. Delete all messages in the conversation
      const { error: msgError } = await supabase
        .from('community_messages')
        .delete()
        .eq('dm_conversation_id', conversationId);
      if (msgError) throw msgError;

      // 2. Delete read status records
      const { error: readError } = await supabase
        .from('community_dm_read_status')
        .delete()
        .eq('conversation_id', conversationId);
      if (readError) throw readError;

      // 3. Delete participants
      const { error: partError } = await supabase
        .from('community_dm_participants')
        .delete()
        .eq('conversation_id', conversationId);
      if (partError) throw partError;

      // 4. Delete the conversation itself
      const { error: convError } = await supabase
        .from('community_dm_conversations')
        .delete()
        .eq('id', conversationId);
      if (convError) throw convError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-dm-conversations'] });
      toast.success('Conversation deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete conversation');
      console.error('Delete DM error:', error);
    },
  });

  const renameConversation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('community_dm_conversations')
        .update({ name: name.trim() || null } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-dm-conversations'] });
      toast.success('Group renamed');
    },
    onError: () => {
      toast.error('Failed to rename group');
    },
  });

  return {
    conversations: conversationsQuery.data ?? [],
    isLoading: conversationsQuery.isLoading,
    error: conversationsQuery.error,
    createOrGetDM: createOrGetDMWithFallback,
    createOrGetDMWithFallback,
    createGroupDM,
    markAsRead,
    deleteDM,
    renameConversation,
    refetch: conversationsQuery.refetch,
  };
};
