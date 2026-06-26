-- Doorstead V1 — inquiries (Unit 1 / AGE-56)
--
-- Replaces the embedded Google Form with an in-app lead capture path.
--
-- PII confidentiality boundary: this rests entirely on (a) RLS being ENABLED
-- on this table and (b) the ABSENCE of any SELECT policy for anon. With no
-- anon SELECT policy, an inserted row is invisible to the anon role, so a lead's
-- name/email/phone can only ever be read by an admin (the authenticated-admin
-- SELECT policy below). Do not add an anon SELECT/UPDATE/DELETE policy.
--
-- Cross-policy coupling (LOAD-BEARING): inquiries_anon_insert's WITH CHECK
-- subquery `select id from listings where status='live' and deleted_at is null`
-- runs as the anon role and is itself gated by the existing listings_public_read
-- policy (migration 0001). It works only because its predicate is an exact
-- subset of listings_public_read. If listing visibility is ever tightened,
-- anon inquiry inserts will start failing with a generic RLS error — update
-- this subquery in lockstep with any change to listings_public_read.

create table inquiries (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references listings(id) on delete cascade,
  name        text not null check (char_length(name) <= 200),
  email       text not null check (char_length(email) <= 320),
  phone       text not null check (char_length(phone) <= 40),
  created_at  timestamptz not null default now()
);

alter table inquiries enable row level security;

create policy inquiries_anon_insert on inquiries
  for insert to anon
  with check (
    listing_id in (
      select id from listings where status = 'live' and deleted_at is null
    )
  );

create policy inquiries_admin_read on inquiries
  for select to authenticated
  using (auth.uid() in (select user_id from admins));
