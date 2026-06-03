-- User profiles (extends Supabase auth.users)
create table public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  age integer,
  gender text check (gender in ('male', 'female', 'non_binary', 'prefer_not_to_say')),
  max_hr integer,
  resting_hr integer,
  current_weekly_mileage_km numeric(5,1),
  runs_per_week integer,
  available_days integer[] default '{}',
  preferred_long_run_day integer,
  strength_preference text check (strength_preference in ('none', 'light', 'moderate', 'heavy')),
  coach_mode text default 'suggest' check (coach_mode in ('suggest', 'auto_adapt')),
  onboarding_completed boolean default false,
  onboarding_step integer default 0,
  dark_mode text default 'system' check (dark_mode in ('system', 'light', 'dark')),
  strava_connected boolean default false,
  strava_athlete_id text,
  strava_access_token text,
  strava_refresh_token text,
  strava_token_expires_at bigint,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Goals
create table public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  type text not null check (type in ('race', 'target_time', 'just_improve')),
  race_distance text check (race_distance in ('5k', '10k', 'half_marathon', 'marathon')),
  target_time_seconds integer,
  race_date date,
  baseline_5k_seconds integer,
  baseline_10k_seconds integer,
  baseline_half_seconds integer,
  baseline_marathon_seconds integer,
  plan_weeks integer default 17,
  active boolean default true,
  created_at timestamptz default now()
);

-- Constraints
create table public.constraints (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  type text not null check (type in ('recurring_activity', 'one_off', 'vacation', 'injury')),
  activity_type text,
  day_of_week integer,
  start_date date,
  end_date date,
  vacation_mode text check (vacation_mode in ('rest', 'travel_light', 'active')),
  injury_description text,
  injury_severity text check (injury_severity in ('minor', 'moderate', 'severe')),
  load_impact text default 'medium' check (load_impact in ('low', 'medium', 'high')),
  details jsonb,
  active boolean default true,
  created_at timestamptz default now()
);

-- Plan intents (abstract weekly structure)
create table public.plan_intents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  goal_id uuid references public.goals(id) on delete cascade not null,
  week_number integer not null,
  phase text not null check (phase in ('base', 'build', 'peak', 'taper', 'race')),
  week_state text default 'planned' check (week_state in ('planned', 'current', 'completed', 'adapted', 'vacation', 'recovery')),
  total_distance_km numeric(5,1) not null,
  long_run_km numeric(4,1) not null,
  quality_sessions integer default 1,
  description text not null,
  is_recovery boolean default false,
  adaptation_reason text,
  starts_on date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sessions (concrete workouts)
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  plan_intent_id uuid references public.plan_intents(id) on delete cascade not null,
  week_number integer not null,
  day_of_week integer not null,
  session_date date not null,
  type text not null check (type in ('easy', 'long', 'tempo', 'intervals', 'hills', 'recovery', 'race', 'strength', 'cross_training', 'rest')),
  title text not null,
  description text not null,
  distance_km numeric(5,1),
  target_pace_min_km numeric(4,2),
  target_hr_zone integer,
  duration_minutes integer,
  structure jsonb default '{"blocks":[]}',
  status text default 'planned' check (status in ('planned', 'completed', 'skipped', 'adapted')),
  order_in_day integer default 0,
  adaptation_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Session logs (actuals after completion)
create table public.session_logs (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  actual_distance_km numeric(5,1),
  actual_duration_seconds integer,
  avg_hr integer,
  max_hr integer,
  avg_pace_min_km numeric(4,2),
  rpe integer check (rpe >= 1 and rpe <= 10),
  notes text,
  strava_activity_id text,
  completed_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Coach messages
create table public.coach_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  action_type text default 'none' check (action_type in ('none', 'proposal', 'applied', 'skipped', 'tweaked')),
  action_data jsonb,
  created_at timestamptz default now()
);

-- Audit log
create table public.audit_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  action text not null,
  reason text not null,
  details jsonb default '{}',
  coach_message_id uuid references public.coach_messages(id),
  undone boolean default false,
  undo_data jsonb,
  created_at timestamptz default now()
);

-- RLS policies
alter table public.user_profiles enable row level security;
alter table public.goals enable row level security;
alter table public.constraints enable row level security;
alter table public.plan_intents enable row level security;
alter table public.sessions enable row level security;
alter table public.session_logs enable row level security;
alter table public.coach_messages enable row level security;
alter table public.audit_entries enable row level security;

-- Users can only access their own data
create policy "Users can view own profile" on public.user_profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.user_profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.user_profiles for insert with check (auth.uid() = id);

create policy "Users can manage own goals" on public.goals for all using (auth.uid() = user_id);
create policy "Users can manage own constraints" on public.constraints for all using (auth.uid() = user_id);
create policy "Users can manage own plan intents" on public.plan_intents for all using (auth.uid() = user_id);
create policy "Users can manage own sessions" on public.sessions for all using (auth.uid() = user_id);
create policy "Users can manage own session logs" on public.session_logs for all using (auth.uid() = user_id);
create policy "Users can manage own coach messages" on public.coach_messages for all using (auth.uid() = user_id);
create policy "Users can manage own audit entries" on public.audit_entries for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes
create index idx_sessions_user_date on public.sessions(user_id, session_date);
create index idx_sessions_plan_intent on public.sessions(plan_intent_id);
create index idx_plan_intents_user_goal on public.plan_intents(user_id, goal_id);
create index idx_session_logs_session on public.session_logs(session_id);
create index idx_coach_messages_user on public.coach_messages(user_id, created_at);
create index idx_audit_entries_user on public.audit_entries(user_id, created_at);
create index idx_constraints_user on public.constraints(user_id, active);
