-- ============================================================
-- User-submitted news ticker messages
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

-- Track who submitted each message (null = admin post)
alter table public.news_messages
  add column if not exists submitted_by uuid references public.profiles(id) on delete set null;

-- Admin controls for user submissions
alter table public.gacha_config
  add column if not exists user_news_enabled          boolean default false not null,
  add column if not exists user_news_cooldown_minutes integer default 5     not null,
  add column if not exists user_news_auto_active      boolean default false not null;
-- user_news_auto_active: false = admin must toggle ON; true = appears in ticker immediately

-- Track last submission time per user (same pattern as last_bonus_token_at)
alter table public.profiles
  add column if not exists last_news_submission_at timestamp with time zone;
