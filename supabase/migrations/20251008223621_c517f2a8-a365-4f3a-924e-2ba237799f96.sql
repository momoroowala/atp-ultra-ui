-- Create app_config table for application configuration
CREATE TABLE public.app_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key text NOT NULL UNIQUE,
  config_value text,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Mega admins can view all config
CREATE POLICY "Mega admins can view all config"
ON public.app_config
FOR SELECT
USING (has_role(auth.uid(), 'mega_admin'));

-- Mega admins can insert config
CREATE POLICY "Mega admins can insert config"
ON public.app_config
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'mega_admin'));

-- Mega admins can update config
CREATE POLICY "Mega admins can update config"
ON public.app_config
FOR UPDATE
USING (has_role(auth.uid(), 'mega_admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_app_config_updated_at
BEFORE UPDATE ON public.app_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data
INSERT INTO public.app_config (config_key, config_value, description)
VALUES ('n8n_webhook_url', '', 'N8N Webhook URL for AI agent integrations')
ON CONFLICT (config_key) DO NOTHING;