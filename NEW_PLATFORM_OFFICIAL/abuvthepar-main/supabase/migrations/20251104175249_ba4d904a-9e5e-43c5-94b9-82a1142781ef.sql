-- Mark user_roles table as deprecated
COMMENT ON TABLE public.user_roles IS 'DEPRECATED: This table is no longer used. Please use user_profiles.role_id instead. Kept for legacy support only.';

-- Mark has_role() function as legacy support
COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 'LEGACY SUPPORT ONLY: This function queries the deprecated user_roles table. Use has_role_key() or is_admin() functions instead, which work with user_profiles.role_id.';