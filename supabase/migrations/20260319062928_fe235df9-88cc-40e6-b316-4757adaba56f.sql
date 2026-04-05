
create table public.call_rsvps (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references public.calendar_calls(id) on delete cascade not null,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  status text not null check (status in ('yes', 'no')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (call_id, user_id)
);

alter table public.call_rsvps enable row level security;

create policy "Authenticated can read RSVPs"
  on public.call_rsvps for select to authenticated using (true);

create policy "Users can insert own RSVP"
  on public.call_rsvps for insert to authenticated with check (user_id = auth.uid());

create policy "Users can update own RSVP"
  on public.call_rsvps for update to authenticated using (user_id = auth.uid());

create trigger handle_call_rsvps_updated_at
  before update on public.call_rsvps
  for each row execute function public.handle_updated_at();
