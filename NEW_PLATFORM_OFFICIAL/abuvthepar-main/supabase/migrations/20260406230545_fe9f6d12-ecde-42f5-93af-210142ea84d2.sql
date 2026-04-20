CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE default_role_id uuid := '6d8d1e65-f743-46fd-aa0e-bb47def1ce53';
DECLARE is_google_oauth boolean;
BEGIN
  is_google_oauth := (NEW.raw_app_meta_data->>'provider') = 'google';

  -- For Google OAuth: only upsert if a profile was already pre-provisioned
  IF is_google_oauth THEN
    UPDATE public.user_profiles SET
      user_email = COALESCE(NEW.email, user_profiles.user_email),
      first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', user_profiles.first_name),
      last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', user_profiles.last_name)
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- For non-Google signups (invite, email), keep existing behavior
  INSERT INTO public.user_profiles (id, user_email, first_name, last_name, phone, tier_id, role_id)
  VALUES (
    NEW.id, NEW.email, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone', (NEW.raw_user_meta_data->>'tier_id')::uuid,
    COALESCE((NEW.raw_user_meta_data->>'role_id')::uuid, default_role_id)
  )
  ON CONFLICT (id) DO UPDATE SET
    user_email = COALESCE(EXCLUDED.user_email, user_profiles.user_email),
    first_name = COALESCE(EXCLUDED.first_name, user_profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, user_profiles.last_name),
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
    tier_id = COALESCE(EXCLUDED.tier_id, user_profiles.tier_id),
    role_id = COALESCE(EXCLUDED.role_id, user_profiles.role_id);
  RETURN NEW;
END;
$$;