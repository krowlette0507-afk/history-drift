-- Celebrate flow: celebration events, guests, RSVPs, memories, media

create table if not exists celebration_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  honoree_name text not null,
  title text not null,
  description text,
  welcome_message text,
  date date not null,
  start_time text,
  end_time text,
  venue text not null,
  address text,
  parking_information text,
  dress_information text,
  rsvp_deadline date,
  host_contact text,
  hero_images text[] default '{}',
  email_wording text,
  sms_wording text,
  memory_invitation_wording text,
  is_active boolean default true
);

create table if not exists celebration_guests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  celebration_event_id uuid references celebration_events(id) on delete cascade,
  first_name text not null,
  last_name text,
  email text,
  mobile text,
  invitation_token text not null unique,
  expected_party_size integer,
  invitation_method text check (invitation_method in ('email','sms','both')),
  invitation_sent boolean default false,
  invitation_sent_date timestamptz,
  rsvp_date timestamptz,
  notes text
);

create table if not exists celebration_rsvps (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  guest_id uuid references celebration_guests(id) on delete cascade,
  celebration_event_id uuid references celebration_events(id) on delete cascade,
  response text not null check (response in ('yes','no','maybe')),
  party_size integer default 1,
  dietary_restrictions text,
  song_request text,
  notes text,
  submitted_at timestamptz,
  updated_at timestamptz
);

create table if not exists celebration_guest_party_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  rsvp_id uuid references celebration_rsvps(id) on delete cascade,
  guest_id uuid references celebration_guests(id) on delete cascade,
  name text not null,
  adult_or_child text check (adult_or_child in ('adult','child')),
  meal_notes text
);

create table if not exists celebration_memories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  celebration_event_id uuid references celebration_events(id) on delete cascade,
  guest_id uuid references celebration_guests(id) on delete cascade,
  storyteller_name text,
  storyteller_email text,
  storyteller_mobile text,
  relationship text check (relationship in ('family','friend','school','military','work','sports','neighbor','other')),
  title text,
  story_text text,
  audio_file text,
  transcript text,
  approximate_year integer,
  decade text,
  location text,
  people_present text[],
  permission_family boolean default true,
  permission_historydrift boolean default false,
  status text default 'submitted' check (status in ('submitted','reviewed','selected','preparing_assets','ready','presented','archived'))
);

create table if not exists celebration_memory_media (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  memory_id uuid references celebration_memories(id) on delete cascade,
  celebration_event_id uuid references celebration_events(id) on delete cascade,
  media_type text not null check (media_type in ('image','audio')),
  file_url text not null,
  caption text,
  original_filename text
);

-- Indexes for token lookups (hot path for every guest page load)
create index if not exists idx_guests_token on celebration_guests(invitation_token);
create index if not exists idx_rsvps_guest on celebration_rsvps(guest_id);
create index if not exists idx_memories_event on celebration_memories(celebration_event_id);
create index if not exists idx_media_event on celebration_memory_media(celebration_event_id, media_type);

-- RLS: all tables are admin-only; guests use service-role API routes
alter table celebration_events enable row level security;
alter table celebration_guests enable row level security;
alter table celebration_rsvps enable row level security;
alter table celebration_guest_party_members enable row level security;
alter table celebration_memories enable row level security;
alter table celebration_memory_media enable row level security;

-- Only service role (used by API routes) can read/write; regular anon/authed users cannot
-- No policies → table is locked to service role only, which is what we want
