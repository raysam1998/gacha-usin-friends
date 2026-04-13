-- ============================================================
-- News ticker messages — admin-managed scrolling text feed
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

create table if not exists public.news_messages (
  id         uuid default uuid_generate_v4() primary key,
  message    text not null,
  active     boolean default true not null,
  created_at timestamp with time zone default now() not null
);

alter table public.news_messages enable row level security;

-- Everyone can read messages (ticker is visible to all logged-in users)
create policy "news_select_all"
  on public.news_messages for select using (true);

-- Only admins can insert / update / delete
create policy "news_admin_all"
  on public.news_messages for all using (public.is_admin());
