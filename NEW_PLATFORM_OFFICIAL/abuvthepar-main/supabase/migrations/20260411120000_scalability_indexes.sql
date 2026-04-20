-- Scalability indexes
-- Additive only. All indexes use IF NOT EXISTS so this migration is idempotent.
-- Note: CONCURRENTLY is omitted because Supabase CLI wraps migrations in a transaction.
-- At current table sizes the brief write lock during index build is acceptable.

-- Hot composite for channel message feed (covers feed queries + RLS subqueries)
CREATE INDEX IF NOT EXISTS idx_community_messages_channel_feed
  ON public.community_messages (channel_id, created_at DESC, sender_id)
  WHERE channel_id IS NOT NULL AND is_deleted = false;

-- Hot composite for DM feed
CREATE INDEX IF NOT EXISTS idx_community_messages_dm_feed
  ON public.community_messages (dm_conversation_id, created_at DESC, sender_id)
  WHERE dm_conversation_id IS NOT NULL AND is_deleted = false;

-- Composite for the DM-participants join (conversation_id, user_id)
CREATE INDEX IF NOT EXISTS idx_community_dm_participants_conv_user
  ON public.community_dm_participants (conversation_id, user_id);

-- GIN for mention lookups
CREATE INDEX IF NOT EXISTS idx_community_messages_mentions_gin
  ON public.community_messages USING GIN (mentions);

-- Active-channel partial
CREATE INDEX IF NOT EXISTS idx_community_channels_is_active
  ON public.community_channels (id) WHERE is_active = true;

-- Per-user dashboards / admin filters
CREATE INDEX IF NOT EXISTS idx_daily_reviews_user_date
  ON public.daily_reviews (user_id, review_date DESC);

CREATE INDEX IF NOT EXISTS idx_trade_records_user_created
  ON public.trade_records (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_responses_user_created
  ON public.task_responses (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role_id
  ON public.user_profiles (role_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active
  ON public.user_profiles (is_active);
