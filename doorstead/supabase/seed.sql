-- Dev/local seed: a test admin so anyone can log in and exercise the app.
--
-- Credentials (DEV ONLY, never seed this into production):
--   email:    admin@doorstead.test
--   password: Passw0rd!demo
--
-- Runs automatically on `supabase db reset` against the local stack. For a
-- hosted project, paste this once into the SQL editor. Idempotent: re-running
-- changes nothing.

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'admin@doorstead.test';

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id, 'authenticated', 'authenticated', 'admin@doorstead.test',
      extensions.crypt('Passw0rd!demo', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      '', '', '', ''
    );

    insert into auth.identities (
      provider_id, user_id, identity_data, provider,
      created_at, updated_at, last_sign_in_at
    ) values (
      'admin@doorstead.test', v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', 'admin@doorstead.test',
        'email_verified', true
      ),
      'email', now(), now(), now()
    );
  end if;

  -- Grant admin membership (the app checks the admins table, not a role).
  insert into admins (user_id)
  select v_user_id
  where not exists (select 1 from admins where user_id = v_user_id);
end $$;
