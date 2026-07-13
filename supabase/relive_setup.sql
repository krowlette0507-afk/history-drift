-- Run this in the Supabase SQL editor once
-- https://supabase.com/dashboard/project/dvzspmhngyejagmqozpt/sql/new

-- 1. Create the relive_storyboards table
create table if not exists public.relive_storyboards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text null,
  subject_name text null,
  age_stage text not null,
  art_style text not null,
  panel_count integer not null default 12,
  title text null,
  subtitle text null,
  image_url text null,
  character_profile jsonb null,
  storyboard_plan jsonb null,
  status text not null default 'completed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Enable Row Level Security
alter table public.relive_storyboards enable row level security;

-- 3. RLS: users can only see and manage their own storyboards
create policy "Users can manage their own storyboards"
  on public.relive_storyboards
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Create storage bucket for Re-Live media
insert into storage.buckets (id, name, public)
values ('relive-media', 'relive-media', true)
on conflict (id) do nothing;

-- 5. Storage policy: authenticated users can upload to their own folder
create policy "Users can upload their own relive media"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'relive-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- 6. Public read access for generated storyboard images
create policy "Public read access for relive media"
  on storage.objects
  for select
  using (bucket_id = 'relive-media');
