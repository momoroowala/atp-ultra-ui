
CREATE TABLE public.user_main_feed_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.community_channels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel_id)
);

ALTER TABLE public.user_main_feed_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own main feed channel selections"
  ON public.user_main_feed_channels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own main feed channel selections"
  ON public.user_main_feed_channels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own main feed channel selections"
  ON public.user_main_feed_channels FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_main_feed_channels_user_id ON public.user_main_feed_channels(user_id);
