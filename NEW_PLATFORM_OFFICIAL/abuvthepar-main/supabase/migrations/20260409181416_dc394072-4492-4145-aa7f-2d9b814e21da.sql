ALTER TABLE public.community_messages
  ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'text'
    CHECK (post_type IN ('text', 'event', 'announcement'));