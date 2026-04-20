
CREATE OR REPLACE FUNCTION public.calculate_all_unread_counts()
RETURNS TABLE(channel_id uuid, dm_conversation_id uuid, unread_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  -- Channel unread counts
  SELECT
    m.channel_id,
    NULL::uuid AS dm_conversation_id,
    COUNT(*)::bigint AS unread_count
  FROM community_messages m
  LEFT JOIN community_user_channel_settings s
    ON s.channel_id = m.channel_id AND s.user_id = auth.uid()
  WHERE m.channel_id IS NOT NULL
    AND m.sender_id != auth.uid()
    AND (m.is_deleted IS NULL OR m.is_deleted = false)
    AND (m.is_hidden IS NULL OR m.is_hidden = false)
    AND m.created_at > COALESCE(s.last_read_at, '1970-01-01'::timestamptz)
  GROUP BY m.channel_id

  UNION ALL

  -- DM unread counts
  SELECT
    NULL::uuid AS channel_id,
    m.dm_conversation_id,
    COUNT(*)::bigint AS unread_count
  FROM community_messages m
  INNER JOIN community_dm_participants p
    ON p.conversation_id = m.dm_conversation_id AND p.user_id = auth.uid()
  LEFT JOIN community_dm_read_status rs
    ON rs.conversation_id = m.dm_conversation_id AND rs.user_id = auth.uid()
  WHERE m.dm_conversation_id IS NOT NULL
    AND m.sender_id != auth.uid()
    AND (m.is_deleted IS NULL OR m.is_deleted = false)
    AND (m.is_hidden IS NULL OR m.is_hidden = false)
    AND m.created_at > COALESCE(rs.last_read_at, '1970-01-01'::timestamptz)
  GROUP BY m.dm_conversation_id
$$;
