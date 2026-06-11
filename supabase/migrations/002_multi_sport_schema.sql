-- =============================================
-- Migration: Multi-sport Parrot PT schema
-- =============================================

-- Add sport field to sessions
alter table public.sessions add column if not exists sport text default 'running';

-- Races table (seed with race library)
create table if not exists public.races (
  id text primary key,
  name text not null,
  sport text not null,
  country text not null,
  month integer not null,
  distance_km numeric(6,1) not null,
  klassiker boolean default false,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  description text,
  description_sv text,
  created_at timestamptz default now()
);

-- User's selected race goals
create table if not exists public.user_races (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  race_id text references public.races(id),
  custom_name text,
  custom_sport text,
  custom_distance_km numeric(6,1),
  target_date date,
  is_custom boolean default false,
  active boolean default true,
  created_at timestamptz default now()
);

-- User sport profiles (current level + priority)
create table if not exists public.user_sports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  sport text not null,
  experience_level text check (experience_level in ('never', 'some', 'regular')) default 'some',
  priority_weight integer default 25, -- 0-100, all sports sum to 100
  current_ability_data jsonb default '{}', -- e.g. { "5k_time": "25:00", "weekly_km": 30 }
  created_at timestamptz default now()
);

-- Life activities (gym, team sport, work, travel, recovery priority)
create table if not exists public.life_activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  activity_type text not null check (activity_type in ('gym', 'team_sport', 'demanding_work', 'regular_travel', 'recovery_priority')),
  frequency integer default 0, -- times per week
  sport_name text, -- for team_sport type
  impact_level text default 'medium' check (impact_level in ('low', 'medium', 'high')),
  details jsonb default '{}',
  active boolean default true,
  created_at timestamptz default now()
);

-- Weekly check-ins
create table if not exists public.weekly_checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  week_start date not null,
  feeling_score integer check (feeling_score >= 1 and feeling_score <= 5), -- 1=exhausted, 5=great
  coach_message text,
  user_response text,
  plan_adjustments jsonb default '{}',
  status text default 'pending' check (status in ('pending', 'responded', 'accepted', 'tweaked', 'overridden')),
  created_at timestamptz default now()
);

-- Update user_profiles with new fields
alter table public.user_profiles add column if not exists preferred_session_length text default '45-60' check (preferred_session_length in ('30-45', '45-60', '60-90', '90+'));
alter table public.user_profiles add column if not exists time_preference text default 'any' check (time_preference in ('morning', 'evening', 'any'));
alter table public.user_profiles add column if not exists language text default 'en' check (language in ('en', 'sv'));

-- RLS policies for new tables
alter table public.races enable row level security;
alter table public.user_races enable row level security;
alter table public.user_sports enable row level security;
alter table public.life_activities enable row level security;
alter table public.weekly_checkins enable row level security;

create policy "Anyone can read races" on public.races for select using (true);
create policy "Users can manage own user_races" on public.user_races for all using (auth.uid() = user_id);
create policy "Users can manage own user_sports" on public.user_sports for all using (auth.uid() = user_id);
create policy "Users can manage own life_activities" on public.life_activities for all using (auth.uid() = user_id);
create policy "Users can manage own weekly_checkins" on public.weekly_checkins for all using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_user_races_user on public.user_races(user_id, active);
create index if not exists idx_user_sports_user on public.user_sports(user_id);
create index if not exists idx_life_activities_user on public.life_activities(user_id, active);
create index if not exists idx_weekly_checkins_user on public.weekly_checkins(user_id, week_start);
