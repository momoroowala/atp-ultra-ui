-- Allow public access to vapid_public_key config (safe because it's meant to be public)
CREATE POLICY "Anyone can view vapid_public_key" 
ON public.app_config
FOR SELECT
USING (config_key = 'vapid_public_key');

-- Insert the VAPID public key
INSERT INTO public.app_config (config_key, config_value, description)
VALUES (
  'vapid_public_key',
  'BAoXgnD9JAMfOOUJwD-_b_K0-KueJfzGNp7vWSYjh2OD-VUTzi6A1BJjjyHPN5ulxpd1tPSwDIwOePy2xwAeQ5w',
  'VAPID public key for web push notifications'
)
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;