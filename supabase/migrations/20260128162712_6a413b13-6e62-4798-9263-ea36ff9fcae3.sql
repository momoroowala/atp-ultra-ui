-- Create a public-safe user profile table for in-app display (no sensitive fields)
create table if not exists public.user_public_profiles (
  id uuid primary key,
  user_email text,
  first_name text,
  last_name text,
  avatar_url text,
  role_id uuid,
  is_active boolean not null default true,
  updated_at timestamp with time zone not null default now()
);

alter table public.user_public_profiles enable row level security;

-- Authenticated users can read display-safe profiles
DO $$ BEGIN
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_public_profiles' and policyname='Authenticated can view public profiles'
  ) then
    create policy "Authenticated can view public profiles"
    on public.user_public_profiles
    for select
    to authenticated
    using (is_active = true);
  end if;
END $$;

-- No direct writes from clients (sync happens via SECURITY DEFINER trigger)
DO $$ BEGIN
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_public_profiles' and policyname='No direct inserts'
  ) then
    create policy "No direct inserts"
    on public.user_public_profiles
    for insert
    to authenticated
    with check (false);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_public_profiles' and policyname='No direct updates'
  ) then
    create policy "No direct updates"
    on public.user_public_profiles
    for update
    to authenticated
    using (false);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='user_public_profiles' and policyname='No direct deletes'
  ) then
    create policy "No direct deletes"
    on public.user_public_profiles
    for delete
    to authenticated
    using (false);
  end if;
END $$;

-- Sync function: upsert safe fields from user_profiles into user_public_profiles
create or replace function public.sync_user_public_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Ensure this definer function can bypass RLS on target table
  perform set_config('row_security', 'off', true);

  insert into public.user_public_profiles (id, user_email, first_name, last_name, avatar_url, role_id, is_active, updated_at)
  values (new.id, new.user_email, new.first_name, new.last_name, new.avatar_url, new.role_id, coalesce(new.is_active, true), now())
  on conflict (id) do update
    set user_email = excluded.user_email,
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        avatar_url = excluded.avatar_url,
        role_id = excluded.role_id,
        is_active = excluded.is_active,
        updated_at = now();

  return new;
end;
$$;

-- Trigger for insert/update on user_profiles
DO $$ BEGIN
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_sync_user_public_profile'
  ) then
    create trigger trg_sync_user_public_profile
    after insert or update on public.user_profiles
    for each row
    execute function public.sync_user_public_profile();
  end if;
END $$;

-- Backfill existing rows
insert into public.user_public_profiles (id, user_email, first_name, last_name, avatar_url, role_id, is_active, updated_at)
select id, user_email, first_name, last_name, avatar_url, role_id, coalesce(is_active, true), now()
from public.user_profiles
on conflict (id) do update
  set user_email = excluded.user_email,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      avatar_url = excluded.avatar_url,
      role_id = excluded.role_id,
      is_active = excluded.is_active,
      updated_at = now();
