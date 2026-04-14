-- ============================================================
-- Pull particle intensity multiplier
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

alter table public.gacha_config
  add column if not exists particle_multiplier float default 1.0 not null;
