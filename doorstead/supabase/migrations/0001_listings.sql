-- Doorstead V1 — initial schema (Unit 1 / AGE-49)
--
-- Tables: admins, listings
-- Trigger: handle_updated_at (moddatetime) — without this, updated_at
--          never changes on UPDATE and the dashboard ordering breaks silently.
-- RLS: anon may read live + non-deleted listings only.
--      Authenticated may do anything on listings ONLY when the user's
--      auth.uid() appears in the admins table. Gating by role alone is
--      insufficient because the 'authenticated' role is granted to ANY
--      signed-in Supabase user, including a self-signed-up stranger.

create extension if not exists moddatetime schema extensions;

create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table listings (
  id          uuid primary key default gen_random_uuid(),
  address     text,
  type        text,
  price_gbp   int,
  beds        int,
  baths       int,
  area_sqft   int,
  status      text not null default 'draft' check (status in ('draft','live')),
  description text,
  photo_urls  text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create trigger handle_updated_at
  before update on listings
  for each row execute procedure extensions.moddatetime(updated_at);

alter table listings enable row level security;
alter table admins   enable row level security;

create policy admins_self_read on admins
  for select to authenticated
  using (user_id = auth.uid());

create policy listings_public_read on listings
  for select to anon
  using (status = 'live' and deleted_at is null);

create policy listings_admin_all on listings
  for all to authenticated
  using (auth.uid() in (select user_id from admins))
  with check (auth.uid() in (select user_id from admins));
