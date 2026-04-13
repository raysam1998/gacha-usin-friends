-- ============================================================
-- Gacha config extras: bonus token drip + auto-approve threshold
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

-- Bonus token drip config on gacha_config
alter table public.gacha_config
  add column if not exists bonus_token_amount      integer default 0 not null,
  add column if not exists bonus_token_interval_hours numeric(6,2) default 0 not null,
  add column if not exists auto_approve_votes       integer default 4 not null;

-- Track last bonus token grant per user
alter table public.profiles
  add column if not exists last_bonus_token_at timestamp with time zone;
