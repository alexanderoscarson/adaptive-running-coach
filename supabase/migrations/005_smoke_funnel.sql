-- Smoke-test funnel: campaign entry pages + fake paid door (feature/smoke-test-funnel).
-- Written for review — run manually in the Supabase SQL editor.
-- Both tables are service-role only: RLS enabled, NO public policies.

create table public.smoke_funnel_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null unique,
  variant text not null default 'direct'
    check (variant in ('klassiker', 'lopp', 'coach', 'direct')),
  clicked_paid_door boolean not null default false,
  waitlist_only boolean not null default false,
  target_race text,
  utm_source text,
  utm_medium text,
  utm_campaign text
);

create table public.smoke_funnel_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event text not null
    check (event in ('campaign_page_view', 'onboarding_started', 'plan_preview_reached', 'paid_door_clicked', 'waitlist_signup')),
  variant text not null default 'direct'
    check (variant in ('klassiker', 'lopp', 'coach', 'direct')),
  session_key text,
  utm_source text,
  utm_medium text,
  utm_campaign text
);

create index smoke_funnel_events_funnel_idx on public.smoke_funnel_events (variant, event);
create index smoke_funnel_events_session_idx on public.smoke_funnel_events (session_key);

alter table public.smoke_funnel_signups enable row level security;
alter table public.smoke_funnel_events enable row level security;
-- Intentionally no policies: only the service-role key (server route) can touch these.
