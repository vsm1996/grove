-- ─────────────────────────────────────────────
-- GROVE — Supabase Schema
-- Run this in your Supabase SQL editor
-- ─────────────────────────────────────────────

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ── Opportunities ─────────────────────────────

create table public.opportunities (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid references auth.users(id) on delete cascade not null,

  -- Identity
  company                 text not null,
  role                    text not null,
  url                     text,

  -- Status
  status                  text not null default 'saved'
                          check (status in ('saved','applied','interviewing','offer','rejected','archived')),

  -- Alignment
  alignment_score         integer not null default 5 check (alignment_score between 0 and 10),
  alignment_notes         text,

  -- Energy
  energy_type             text not null default 'neutral'
                          check (energy_type in ('expansive','neutral','extractive')),
  energy_intensity        integer not null default 5 check (energy_intensity between 0 and 10),

  -- Signal
  signal_type             text not null default 'cold'
                          check (signal_type in ('cold','recruiter','warm','referral')),
  signal_notes            text,

  -- Positioning Gap
  narrative_angle         text,
  proof_artifact          text,
  skill_gap               text,

  -- Application Context
  resume_version          text,
  jd_notes                text,

  -- Follow-Up
  followup_action         text,
  followup_due_date       date,
  followup_completed      boolean default false,

  -- Timestamps
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ── Reflections ───────────────────────────────
-- Separate table: one opportunity can have multiple reflections
-- (one per interview round)

create table public.reflections (
  id                      uuid primary key default uuid_generate_v4(),
  opportunity_id          uuid references public.opportunities(id) on delete cascade not null,
  user_id                 uuid references auth.users(id) on delete cascade not null,

  sentiment               text not null
                          check (sentiment in ('expanded','neutral','drained')),
  they_listened           boolean not null default true,
  meaningful_challenge    boolean not null default true,
  respectful_engagement   boolean not null default true,
  notes                   text,

  reflected_at            timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────

alter table public.opportunities enable row level security;
alter table public.reflections enable row level security;

-- Users can only see and modify their own opportunities
create policy "Users can view own opportunities"
  on public.opportunities for select
  using (auth.uid() = user_id);

create policy "Users can insert own opportunities"
  on public.opportunities for insert
  with check (auth.uid() = user_id);

create policy "Users can update own opportunities"
  on public.opportunities for update
  using (auth.uid() = user_id);

create policy "Users can delete own opportunities"
  on public.opportunities for delete
  using (auth.uid() = user_id);

-- Users can only see and modify their own reflections
create policy "Users can view own reflections"
  on public.reflections for select
  using (auth.uid() = user_id);

create policy "Users can insert own reflections"
  on public.reflections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reflections"
  on public.reflections for update
  using (auth.uid() = user_id);

create policy "Users can delete own reflections"
  on public.reflections for delete
  using (auth.uid() = user_id);

-- ── Auto-update updated_at ────────────────────

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_opportunity_updated
  before update on public.opportunities
  for each row execute procedure public.handle_updated_at();

-- ── Indexes ───────────────────────────────────

create index opportunities_user_id_idx on public.opportunities(user_id);
create index opportunities_status_idx on public.opportunities(status);
create index opportunities_created_at_idx on public.opportunities(created_at desc);
create index reflections_opportunity_id_idx on public.reflections(opportunity_id);
