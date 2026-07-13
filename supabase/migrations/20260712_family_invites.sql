-- Family invite system

create table if not exists family_invites (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  invitee_email text not null,
  invitee_name  text,
  message       text,
  token         text unique not null default encode(gen_random_bytes(32), 'hex'),
  status        text not null default 'pending',  -- pending | contributed
  created_at    timestamptz not null default now()
);

create table if not exists family_contributions (
  id                 uuid primary key default gen_random_uuid(),
  invite_id          uuid references family_invites(id) on delete cascade not null,
  contributor_name   text not null,
  contributor_email  text,
  relationship       text,
  story              text not null,
  created_at         timestamptz not null default now()
);

-- RLS
alter table family_invites enable row level security;
alter table family_contributions enable row level security;

-- Owners can read/insert/delete their own invites
create policy "owner_all_invites" on family_invites
  for all using (auth.uid() = user_id);

-- Contributions: owner of parent invite can read; anyone with valid token can insert (handled in API via service role)
create policy "owner_read_contributions" on family_contributions
  for select using (
    exists (select 1 from family_invites fi where fi.id = invite_id and fi.user_id = auth.uid())
  );
