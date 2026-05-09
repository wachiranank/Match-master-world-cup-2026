-- ============================================================
-- Match Master — World Cup 2026  |  Initial Schema
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- TEAMS
-- ============================================================
create table if not exists public.teams (
  id            uuid primary key default uuid_generate_v4(),
  name_th       text not null,
  name_en       text not null,
  flag_url      text,
  group_name    text,          -- e.g. 'A', 'B', ... 'L'
  confederation text,          -- AFC, CAF, CONCACAF, CONMEBOL, OFC, UEFA
  created_at    timestamptz not null default now()
);

alter table public.teams enable row level security;
create policy "teams_read_all" on public.teams for select using (true);

-- ============================================================
-- MATCHES
-- ============================================================
create type public.match_stage as enum (
  'group_stage', 'r32', 'r16', 'qf', 'sf', 'third_place', 'final'
);

create type public.match_status as enum (
  'scheduled', 'live', 'completed', 'cancelled'
);

create table if not exists public.matches (
  id              uuid primary key default uuid_generate_v4(),
  home_team_id    uuid references public.teams(id),
  away_team_id    uuid references public.teams(id),
  stage_key       public.match_stage not null default 'group_stage',
  kick_off        timestamptz not null,
  venue_th        text,
  venue_en        text,
  status          public.match_status not null default 'scheduled',
  home_score      smallint,
  away_score      smallint,
  -- Multiplier is derived from stage_key in application code (x1–x6)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on public.matches (kick_off);
create index on public.matches (stage_key);
create index on public.matches (status);

alter table public.matches enable row level security;
create policy "matches_read_all" on public.matches for select using (true);

-- ============================================================
-- PROFILES  (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  display_name   text,
  avatar_url     text,
  preferred_lang text not null default 'th' check (preferred_lang in ('th', 'en')),
  total_points   integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "profiles_read_all"   on public.profiles for select using (true);
create policy "profiles_write_own"  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- CHAMPION PICKS
-- ============================================================
create table if not exists public.champion_picks (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  team_id     uuid not null references public.teams(id),
  picked_at   timestamptz not null default now(),
  is_correct  boolean,           -- set after tournament ends
  unique (user_id)               -- one pick per user
);

alter table public.champion_picks enable row level security;
create policy "champion_picks_read_own"   on public.champion_picks for select  using (auth.uid() = user_id);
create policy "champion_picks_insert_own" on public.champion_picks for insert  with check (auth.uid() = user_id);
create policy "champion_picks_update_own" on public.champion_picks for update  using (auth.uid() = user_id);

-- ============================================================
-- PREDICTIONS
-- ============================================================
create table if not exists public.predictions (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  match_id         uuid not null references public.matches(id),
  predicted_home   smallint not null,
  predicted_away   smallint not null,
  -- Scoring (populated after match finishes)
  points_result    smallint default 0,   -- +1 correct result
  points_score     smallint default 0,   -- +3 correct score
  multiplier       smallint default 1,   -- stage multiplier
  total_points     smallint default 0,   -- (points_result + points_score) * multiplier
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, match_id)
);

create index on public.predictions (user_id);
create index on public.predictions (match_id);

alter table public.predictions enable row level security;
create policy "predictions_read_own"    on public.predictions for select  using (auth.uid() = user_id);
create policy "predictions_insert_own"  on public.predictions for insert  with check (auth.uid() = user_id);
create policy "predictions_update_own"  on public.predictions for update  using (auth.uid() = user_id);

-- Allow leaderboard to read total_points aggregated (view)
create or replace view public.leaderboard as
  select
    p.id,
    p.display_name,
    p.avatar_url,
    p.total_points,
    rank() over (order by p.total_points desc) as rank,
    count(pr.id)    as prediction_count,
    count(pr.id) filter (where pr.points_result > 0 or pr.points_score > 0) as correct_count,
    cp.team_id      as champion_team_id
  from public.profiles p
  left join public.predictions pr  on pr.user_id = p.id
  left join public.champion_picks cp on cp.user_id = p.id
  group by p.id, p.display_name, p.avatar_url, p.total_points, cp.team_id;

-- ============================================================
-- STAGE MULTIPLIER LOOKUP  (reference table)
-- ============================================================
create table if not exists public.stage_multipliers (
  stage_key   public.match_stage primary key,
  multiplier  smallint not null
);

insert into public.stage_multipliers (stage_key, multiplier) values
  ('group_stage', 1),
  ('r32',         2),
  ('r16',         3),
  ('qf',          4),
  ('sf',          5),
  ('third_place', 5),
  ('final',       6)
on conflict do nothing;

alter table public.stage_multipliers enable row level security;
create policy "stage_multipliers_read_all" on public.stage_multipliers for select using (true);
