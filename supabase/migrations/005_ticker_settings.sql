-- ============================================================
-- Ticker display settings: speed (px/sec) and item spacing (px)
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

alter table public.gacha_config
  add column if not exists ticker_speed   integer default 80 not null,
  add column if not exists ticker_spacing integer default 32 not null;
