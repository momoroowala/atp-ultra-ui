
CREATE OR REPLACE FUNCTION public.get_dm_conversations()
RETURNS TABLE (
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
SET search_path = 'public'
AS $$
  WITH my_convs AS (
    SELECT conversation_id
    FROM community_dm_participants
    WHERE user_id = auth.uid()
  ),
  other_parts AS (
    SELECT
      p.conversation_id,
      COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', up.id,
          'first_name', up.first_name,
          'last_name', up.last_name,
          'user_email', up.user_email,
          'avatar_url', up.avatar_url
        )
      ) FILTER (WHERE up.id IS NOT NULL), '[]'::jsonb) AS participants
    FROM community_dm_participants p
    JOIN my_convs mc ON mc.conversation_id = p.conversation_id
    LEFT JOIN user_profiles up ON up.id = p.user_id
    WHERE p.user_id <> auth.uid()
    GROUP BY p.conversation_id
  ),
  last_msgs AS (
    SELECT DISTINCT ON (m.dm_conversation_id)
      m.dm_conversation_id AS conversation_id,
      m.content,
      m.sender_id,
      m.created_at
    FROM community_messages m
    JOIN my_convs mc ON mc.conversation_id = m.dm_conversation_id
    WHERE m.dm_conversation_id IS NOT NULL
      AND (m.is_deleted IS NOT TRUE)
    ORDER BY m.dm_conversation_id, m.created_at DESC
  ),
  unread AS (
    SELECT
      mc.conversation_id,
      COUNT(m.id) AS cnt
    FROM my_convs mc
    LEFT JOIN community_dm_read_status rs
      ON rs.conversation_id = mc.conversation_id AND rs.user_id = auth.uid()
    LEFT JOIN community_messages m
      ON m.dm_conversation_id = mc.conversation_id
      AND m.sender_id <> auth.uid()
      AND (m.is_deleted IS NOT TRUE)
      AND (rs.last_read_at IS NULL OR m.created_at > rs.last_read_at)
    GROUP BY mc.conversation_id
  )
  SELECT
    c.id AS conversation_id,
    c.name AS conversation_name,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    lm.content AS last_message_content,
    lm.sender_id AS last_message_sender_id,
    lm.created_at AS last_message_created_at,
    COALESCE(op.participants, '[]'::jsonb) AS other_participants,
    COALESCE(u.cnt, 0) AS unread_count
  FROM community_dm_conversations c
  JOIN my_convs mc ON mc.conversation_id = c.id
  LEFT JOIN other_parts op ON op.conversation_id = c.id
  LEFT JOIN last_msgs lm ON lm.conversation_id = c.id
  LEFT JOIN unread u ON u.conversation_id = c.id
  ORDER BY COALESCE(c.last_message_at, c.created_at) DESC;
$$;
