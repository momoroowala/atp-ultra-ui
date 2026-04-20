-- Scalability RPCs that replace client-side N+1 query loops.
--
-- Both functions are SECURITY INVOKER so the caller's RLS applies exactly
-- like the existing client-side queries (same visibility, same safety).
-- The functions use auth.uid() directly so callers do not need to pass
-- a user id parameter.

-- ---------------------------------------------------------------------------
-- calculate_all_unread_counts()
--
-- Replaces the channel loop + DM loop in src/hooks/useUnreadCounts.tsx which
-- currently issues one count query per channel/DM conversation.
--
-- Returns one row per channel OR DM conversation with a non-zero unread
-- count for the current user. Rows have either channel_id set (DM null) or
-- dm_conversation_id set (channel_id null).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_all_unread_counts()
RETURNS TABLE(
  channel_id uuid,
  dm_conversation_id uuid,
  unread_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  -- Channel unread counts: one row per active channel visible to the user
  -- with unread messages. Joins community_user_channel_settings to pick up
  -- last_read_at exactly like useUnreadCounts does.
  SELECT
    cc.id AS channel_id,
    NULL::uuid AS dm_conversation_id,
    COUNT(cm.id)::bigint AS unread_count
  FROM public.community_channels cc
  LEFT JOIN public.community_user_channel_settings cus
    ON cus.channel_id = cc.id AND cus.user_id = auth.uid()
  JOIN public.community_messages cm
    ON cm.channel_id = cc.id
    AND cm.is_deleted = false
    AND cm.sender_id <> auth.uid()
    AND (cus.last_read_at IS NULL OR cm.created_at > cus.last_read_at)
  WHERE cc.is_active = true
  GROUP BY cc.id
  HAVING COUNT(cm.id) > 0

  UNION ALL

  -- DM unread counts: one row per conversation the user participates in.
  -- Uses community_dm_read_status.last_read_at (the source of truth for
  -- useUnreadCounts — markDmAsRead writes both tables).
  SELECT
    NULL::uuid AS channel_id,
    cdp.conversation_id AS dm_conversation_id,
    COUNT(cm.id)::bigint AS unread_count
  FROM public.community_dm_participants cdp
  LEFT JOIN public.community_dm_read_status cdrs
    ON cdrs.conversation_id = cdp.conversation_id
    AND cdrs.user_id = auth.uid()
  JOIN public.community_messages cm
    ON cm.dm_conversation_id = cdp.conversation_id
    AND cm.is_deleted = false
    AND cm.sender_id <> auth.uid()
    AND (cdrs.last_read_at IS NULL OR cm.created_at > cdrs.last_read_at)
  WHERE cdp.user_id = auth.uid()
  GROUP BY cdp.conversation_id
  HAVING COUNT(cm.id) > 0;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_all_unread_counts() TO authenticated;

-- ---------------------------------------------------------------------------
-- get_dm_conversations()
--
-- Replaces the per-conversation Promise.all loop in
-- src/hooks/useCommunityDMs.tsx that currently fires 5 queries per DM
-- (participants, profiles, fallback profiles, last message, unread count).
--
-- Returns one row per conversation the user is part of, pre-joined with
-- the other participants (as jsonb), the last message, and the unread
-- count (computed against community_dm_participants.last_read_at — the
-- source of truth for this hook).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dm_conversations()
RETURNS TABLE(
  conversation_id uuid,
  conversation_name text,
  created_at timestamptz,
  updated_at timestamptz,
  last_message_at timestamptz,
  last_message_content text,
  last_message_sender_id uuid,
  last_message_created_at timestamptz,
  other_participants jsonb,
  unread_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  WITH my_convs AS (
    SELECT
      dm.id,
      dm.name AS conversation_name,
      dm.created_at,
      dm.updated_at,
      dm.last_message_at,
      dp.last_read_at
    FROM public.community_dm_conversations dm
    JOIN public.community_dm_participants dp
      ON dp.conversation_id = dm.id
    WHERE dp.user_id = auth.uid()
  )
  SELECT
    mc.id AS conversation_id,
    mc.conversation_name,
    mc.created_at,
    mc.updated_at,
    mc.last_message_at,
    lm.content AS last_message_content,
    lm.sender_id AS last_message_sender_id,
    lm.created_at AS last_message_created_at,
    COALESCE(
      (
        -- user_public_profiles is synced from user_profiles via trigger and
        -- is readable by all authenticated users (unlike user_profiles which
        -- has stricter RLS). This matches the primary path in useCommunityDMs.
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', up.id,
            'first_name', up.first_name,
            'last_name', up.last_name,
            'user_email', up.user_email,
            'avatar_url', up.avatar_url
          )
        )
        FROM public.community_dm_participants p2
        JOIN public.user_public_profiles up ON up.id = p2.user_id
        WHERE p2.conversation_id = mc.id
          AND p2.user_id <> auth.uid()
      ),
      '[]'::jsonb
    ) AS other_participants,
    COALESCE((
      SELECT COUNT(*)::bigint
      FROM public.community_messages cm
      WHERE cm.dm_conversation_id = mc.id
        AND cm.is_deleted = false
        AND cm.sender_id <> auth.uid()
        AND (mc.last_read_at IS NULL OR cm.created_at > mc.last_read_at)
    ), 0) AS unread_count
  FROM my_convs mc
  LEFT JOIN LATERAL (
    SELECT content, sender_id, created_at
    FROM public.community_messages
    WHERE dm_conversation_id = mc.id AND is_deleted = false
    ORDER BY created_at DESC
    LIMIT 1
  ) lm ON true
  ORDER BY mc.last_message_at DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_dm_conversations() TO authenticated;
