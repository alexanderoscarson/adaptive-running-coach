-- =============================================
-- Migration: Ensure multi-sport profile columns exist
-- Safe to re-run — all statements use IF NOT EXISTS
-- =============================================

-- These columns were introduced in 002 but may not have been applied
-- to the live Supabase instance. Adding them here as a safety net.

alter table public.user_profiles add column if not exists preferred_session_length text default '45-60';
alter table public.user_profiles add column if not exists time_preference text default 'any';
alter table public.user_profiles add column if not exists language text default 'en';

-- Ensure new tables from 002 exist (idempotent)

create table if not exists public.races (
  id text primary key,
  name text not null,
  sport text not null,
  country text not null,
  month integer not null,
  distance_km numeric(6,1) not null,
  klassiker boolean default false,
  difficulty text,
  description text,
  description_sv text,
  created_at timestamptz default now()
);

create table if not exists public.user_races (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  race_id text,
  custom_name text,
  custom_sport text,
  custom_distance_km numeric(6,1),
  target_date date,
  is_custom boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.user_sports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  sport text not null,
  experience_level text default 'some',
  priority_weight integer default 25,
  current_ability_data jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists public.life_activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  activity_type text not null,
  frequency integer default 0,
  sport_name text,
  impact_level text default 'medium',
  details jsonb default '{}',
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.weekly_checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  week_start date not null,
  feeling_score integer,
  coach_message text,
  user_response text,
  plan_adjustments jsonb default '{}',
  status text default 'pending',
  created_at timestamptz default now()
);

-- Add sport column to sessions if missing
alter table public.sessions add column if not exists sport text default 'running';

-- RLS (safe to re-run — policies may already exist)
alter table public.races enable row level security;
alter table public.user_races enable row level security;
alter table public.user_sports enable row level security;
alter table public.life_activities enable row level security;
alter table public.weekly_checkins enable row level security;

-- Create policies only if they don't exist (wrapped in DO block)
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Anyone can read races' and tablename = 'races') then
    create policy "Anyone can read races" on public.races for select using (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can manage own user_races' and tablename = 'user_races') then
    create policy "Users can manage own user_races" on public.user_races for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can manage own user_sports' and tablename = 'user_sports') then
    create policy "Users can manage own user_sports" on public.user_sports for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can manage own life_activities' and tablename = 'life_activities') then
    create policy "Users can manage own life_activities" on public.life_activities for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can manage own weekly_checkins' and tablename = 'weekly_checkins') then
    create policy "Users can manage own weekly_checkins" on public.weekly_checkins for all using (auth.uid() = user_id);
  end if;
end $$;

-- Indexes (safe to re-run)
create index if not exists idx_user_races_user on public.user_races(user_id, active);
create index if not exists idx_user_sports_user on public.user_sports(user_id);
create index if not exists idx_life_activities_user on public.life_activities(user_id, active);
create index if not exists idx_weekly_checkins_user on public.weekly_checkins(user_id, week_start);
