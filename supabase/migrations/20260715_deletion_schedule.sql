-- User data deletion schedule
create table if not exists user_deletion_schedule (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete cascade unique not null,
  scheduled_for    timestamptz not null,          -- when to permanently delete (30 days after trigger)
  warning_sent_at  timestamptz,                   -- when 14-day warning email was sent
  deleted_at       timestamptz,                   -- when deletion was completed
  reason           text not null default 'subscription_ended',
  created_at       timestamptz not null default now()
);

alter table user_deletion_schedule enable row level security;

-- Only service role can read/write (no user-facing access — managed server-side only)
create policy "service_role_only" on user_deletion_schedule
  for all using (false);
