-- ============================================================
-- GACHA-USIN-FRIENDS — Initial Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type rarity_tier as enum ('common', 'rare', 'epic', 'legendary');
create type trade_status as enum ('pending', 'accepted', 'rejected', 'cancelled');
create type proposal_status as enum ('voting', 'approved', 'rejected');
create type vote_type as enum ('approve', 'reject');

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends auth.users, auto-created on signup via trigger)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  is_admin boolean default false not null,
  tokens integer default 10 not null,
  last_token_refresh timestamp with time zone default now() not null,
  pity_counter integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

-- Characters (a "homie")
create table public.characters (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  bio text,
  created_at timestamp with time zone default now() not null
);

-- Cards (a specific card variant)
create table public.cards (
  id uuid default uuid_generate_v4() primary key,
  character_id uuid references public.characters on delete cascade not null,
  variant_name text not null,
  rarity rarity_tier not null,
  image_url text not null,
  created_at timestamp with time zone default now() not null
);

-- User cards (the collection — which user owns which cards)
create table public.user_cards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  card_id uuid references public.cards on delete cascade not null,
  obtained_at timestamp with time zone default now() not null,
  is_tradeable boolean default true not null
);

-- Trades
create table public.trades (
  id uuid default uuid_generate_v4() primary key,
  from_user_id uuid references public.profiles on delete cascade not null,
  to_user_id uuid references public.profiles on delete cascade not null,
  status trade_status default 'pending' not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Trade items (cards involved in a trade)
create table public.trade_items (
  id uuid default uuid_generate_v4() primary key,
  trade_id uuid references public.trades on delete cascade not null,
  user_card_id uuid references public.user_cards on delete cascade not null,
  offered_by uuid references public.profiles on delete cascade not null
);

-- Card proposals (community-submitted card ideas)
create table public.card_proposals (
  id uuid default uuid_generate_v4() primary key,
  proposed_by uuid references public.profiles on delete cascade not null,
  character_id uuid references public.characters on delete set null,
  new_character_name text,
  variant_name text not null,
  image_url text not null,
  proposed_rarity rarity_tier not null,
  status proposal_status default 'voting' not null,
  admin_note text,
  created_at timestamp with time zone default now() not null
);

-- Proposal votes
create table public.proposal_votes (
  id uuid default uuid_generate_v4() primary key,
  proposal_id uuid references public.card_proposals on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  vote vote_type not null,
  voted_rarity rarity_tier not null,
  created_at timestamp with time zone default now() not null,
  unique(proposal_id, user_id)
);

-- Gacha config (admin-tunable settings — single row)
create table public.gacha_config (
  id uuid default uuid_generate_v4() primary key,
  daily_tokens integer default 10 not null,
  pull_cost integer default 1 not null,
  common_weight integer default 60 not null,
  rare_weight integer default 25 not null,
  epic_weight integer default 10 not null,
  legendary_weight integer default 5 not null,
  dupe_reroll_cost integer default 3 not null,
  pity_threshold integer default 50 not null
);

-- Seed default gacha config
insert into public.gacha_config (id) values (uuid_generate_v4());

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Security-definer function to check admin status (avoids RLS recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Auto-create profile on new Supabase auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update trades.updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trades_updated_at
  before update on public.trades
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.cards enable row level security;
alter table public.user_cards enable row level security;
alter table public.trades enable row level security;
alter table public.trade_items enable row level security;
alter table public.card_proposals enable row level security;
alter table public.proposal_votes enable row level security;
alter table public.gacha_config enable row level security;

-- profiles
create policy "profiles_select_all"   on public.profiles for select using (true);
create policy "profiles_update_own"   on public.profiles for update using (auth.uid() = id);

-- characters
create policy "characters_select_all" on public.characters for select using (true);
create policy "characters_admin_all"  on public.characters for all using (public.is_admin());

-- cards
create policy "cards_select_all"      on public.cards for select using (true);
create policy "cards_admin_all"       on public.cards for all using (public.is_admin());

-- user_cards
create policy "user_cards_select_all" on public.user_cards for select using (true);
create policy "user_cards_insert_own" on public.user_cards for insert with check (auth.uid() = user_id);
create policy "user_cards_update_own" on public.user_cards for update using (auth.uid() = user_id);
create policy "user_cards_delete_own" on public.user_cards for delete using (auth.uid() = user_id);

-- trades
create policy "trades_select_own"     on public.trades for select using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);
create policy "trades_insert_own"     on public.trades for insert with check (auth.uid() = from_user_id);
create policy "trades_update_own"     on public.trades for update using (
  auth.uid() = from_user_id or auth.uid() = to_user_id
);

-- trade_items
create policy "trade_items_select"    on public.trade_items for select using (
  exists (
    select 1 from public.trades
    where id = trade_id
    and (from_user_id = auth.uid() or to_user_id = auth.uid())
  )
);
create policy "trade_items_insert"    on public.trade_items for insert with check (auth.uid() = offered_by);

-- card_proposals
create policy "proposals_select_all"  on public.card_proposals for select using (true);
create policy "proposals_insert_own"  on public.card_proposals for insert with check (auth.uid() = proposed_by);
create policy "proposals_update_admin" on public.card_proposals for update using (public.is_admin());

-- proposal_votes
create policy "votes_select_all"      on public.proposal_votes for select using (true);
create policy "votes_insert_own"      on public.proposal_votes for insert with check (auth.uid() = user_id);
create policy "votes_update_own"      on public.proposal_votes for update using (auth.uid() = user_id);
create policy "votes_delete_own"      on public.proposal_votes for delete using (auth.uid() = user_id);

-- gacha_config
create policy "config_select_all"     on public.gacha_config for select using (true);
create policy "config_update_admin"   on public.gacha_config for update using (public.is_admin());
