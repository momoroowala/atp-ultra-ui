
create table public.webhook_test_logs (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  headers jsonb,
  method text,
  created_at timestamptz default now()
);

alter table public.webhook_test_logs enable row level security;

create policy "Staff can read webhook test logs"
  on public.webhook_test_logs for select
  to authenticated
  using (public.is_staff(auth.uid()));
