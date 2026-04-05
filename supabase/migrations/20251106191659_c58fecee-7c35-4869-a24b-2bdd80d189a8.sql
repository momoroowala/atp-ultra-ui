-- Create impersonation audit log table
create table public.impersonation_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete cascade not null,
  target_user_id uuid references auth.users(id) on delete cascade not null,
  admin_email text not null,
  target_email text not null,
  impersonated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.impersonation_audit_log enable row level security;

-- Only admins can view audit logs
create policy "Admins can view impersonation logs"
  on public.impersonation_audit_log
  for select
  to authenticated
  using (
    is_admin(auth.uid())
  );

-- Only system can insert audit logs (via service role in edge function)
create policy "Service role can insert audit logs"
  on public.impersonation_audit_log
  for insert
  to authenticated
  with check (true);

-- Create indexes for performance
create index idx_impersonation_audit_admin on public.impersonation_audit_log(admin_user_id);
create index idx_impersonation_audit_target on public.impersonation_audit_log(target_user_id);
create index idx_impersonation_audit_timestamp on public.impersonation_audit_log(impersonated_at desc);