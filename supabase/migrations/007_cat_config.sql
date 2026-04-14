-- ============================================================
-- Legendary pull animation settings (Chipi Chipi Chapa Chapa)
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

alter table public.gacha_config
  add column if not exists legendary_cat_count    integer default 8   not null,
  add column if not exists legendary_cat_duration integer default 8   not null,
  add column if not exists legendary_cat_volume   float   default 0.4 not null;
