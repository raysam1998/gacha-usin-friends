-- Run in Supabase Dashboard > SQL Editor

create table public.signup_requests (
  id            uuid default uuid_generate_v4() primary key,
  username      text not null unique,
  display_name  text,
  message       text,
  status        text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note    text,
  created_at    timestamp with time zone default now() not null
);

alter table public.signup_requests enable row level security;

-- Public can insert (unauthenticated signup form)
create policy "signup_requests_insert" on public.signup_requests for insert with check (true);
-- Anyone can read (so requestor can check status later if needed)
create policy "signup_requests_select" on public.signup_requests for select using (true);
-- Only admin can update (approve/reject)
create policy "signup_requests_admin_update" on public.signup_requests for update using (public.is_admin());
