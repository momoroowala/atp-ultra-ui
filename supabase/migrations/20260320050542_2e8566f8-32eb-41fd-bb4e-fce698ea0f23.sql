ALTER TABLE public.community_channels ADD COLUMN is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.community_channels ADD COLUMN pin_order INTEGER DEFAULT 0;