-- LifeStory AI — Supabase schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles: the "subject" of a story (could be the user themselves or a loved one)
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subject_name text not null,
  subject_relationship text, -- "Myself", "Father", "Grandmother", etc.
  birth_year int,
  birth_place text,
  avatar_url text,
  bio_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Interviews
create table if not exists interviews (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  interviewer_id text not null, -- e.g. "dr_james_carter"
  title text not null default 'Untitled Interview',
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  started_at timestamptz default now(),
  completed_at timestamptz,
  duration_seconds int
);

-- Messages (interview conversation turns)
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  interview_id uuid references interviews(id) on delete cascade not null,
  role text not null check (role in ('assistant', 'user')),
  content text not null,
  audio_url text,
  created_at timestamptz default now()
);

-- People mentioned in interviews
create table if not exists people (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  relationship text,
  description text,
  birth_year int,
  created_at timestamptz default now()
);

-- Places mentioned in interviews
create table if not exists places (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  place_type text, -- 'home', 'school', 'work', 'travel', etc.
  description text,
  years_lived text,
  significance text,
  created_at timestamptz default now()
);

-- Timeline events
create table if not exists timeline_events (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  year int,
  date_description text,
  title text not null,
  description text,
  category text, -- 'Birth', 'Education', 'Career', 'Family', 'Travel', etc.
  created_at timestamptz default now()
);

-- Life lessons
create table if not exists life_lessons (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  lesson text not null,
  context text,
  category text,
  created_at timestamptz default now()
);

-- Biography drafts
create table if not exists biography_drafts (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  title text not null default 'My Life Story',
  content text not null,
  style text not null default 'narrative' check (style in ('narrative', 'chronological', 'thematic')),
  version int not null default 1,
  created_at timestamptz default now()
);

-- Legacy documents
create table if not exists legacy_documents (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  doc_type text not null check (doc_type in ('letter', 'tribute', 'wishes', 'values', 'advice')),
  title text not null,
  content text not null,
  recipient text,
  created_at timestamptz default now()
);

-- Family vault access
create table if not exists vault_members (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete cascade not null,
  invited_email text not null,
  invited_by uuid references auth.users(id) not null,
  access_level text not null default 'read' check (access_level in ('read', 'contribute')),
  accepted_at timestamptz,
  created_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table interviews enable row level security;
alter table messages enable row level security;
alter table people enable row level security;
alter table places enable row level security;
alter table timeline_events enable row level security;
alter table life_lessons enable row level security;
alter table biography_drafts enable row level security;
alter table legacy_documents enable row level security;
alter table vault_members enable row level security;

-- RLS policies: users own their profiles
create policy "Users can manage own profiles"
  on profiles for all using (auth.uid() = user_id);

-- Cascade RLS via profile ownership
create policy "Users can manage own interviews"
  on interviews for all using (
    exists (select 1 from profiles where profiles.id = interviews.profile_id and profiles.user_id = auth.uid())
  );

create policy "Users can manage own messages"
  on messages for all using (
    exists (
      select 1 from interviews i
      join profiles p on p.id = i.profile_id
      where i.id = messages.interview_id and p.user_id = auth.uid()
    )
  );

create policy "Users can manage own people"
  on people for all using (
    exists (select 1 from profiles where profiles.id = people.profile_id and profiles.user_id = auth.uid())
  );

create policy "Users can manage own places"
  on places for all using (
    exists (select 1 from profiles where profiles.id = places.profile_id and profiles.user_id = auth.uid())
  );

create policy "Users can manage own timeline"
  on timeline_events for all using (
    exists (select 1 from profiles where profiles.id = timeline_events.profile_id and profiles.user_id = auth.uid())
  );

create policy "Users can manage own lessons"
  on life_lessons for all using (
    exists (select 1 from profiles where profiles.id = life_lessons.profile_id and profiles.user_id = auth.uid())
  );

create policy "Users can manage own biography"
  on biography_drafts for all using (
    exists (select 1 from profiles where profiles.id = biography_drafts.profile_id and profiles.user_id = auth.uid())
  );

create policy "Users can manage own legacy docs"
  on legacy_documents for all using (
    exists (select 1 from profiles where profiles.id = legacy_documents.profile_id and profiles.user_id = auth.uid())
  );

create policy "Users can manage vault members"
  on vault_members for all using (
    exists (select 1 from profiles where profiles.id = vault_members.profile_id and profiles.user_id = auth.uid())
  );

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();
