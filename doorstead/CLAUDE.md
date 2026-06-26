# doorstead — app conventions

These conventions apply to every file inside `doorstead/`. They are non-negotiable for V1; later units extend the same shape.

## Module direction (deep modules — do not reverse)

```
routes (app/**)  →  service contract (lib/*/contract.ts)
                    ↘ never imports Supabase directly
service impl (lib/*/service.ts)  →  lib/db/*
lib/db/*  →  @supabase/supabase-js
```

- Routes (server components, server actions) import only `ListingService` and `AuthService` contract types and their typed singletons. Never `@supabase/*`.
- `Default*Service` implementations are the only callers of `lib/db/`.
- `lib/db/` is the only folder that imports `@supabase/supabase-js`.
- UI components in `components/**` never import services or the DB. They receive data and callbacks as props.

## Two Supabase clients

- `lib/db/anon-client.ts` — cookie-free, used by public reads. RLS sees the anon role.
- `lib/db/server-client.ts` — cookie-aware (added in Unit 3 / AGE-51), used by admin reads and writes. RLS sees the authenticated user via membership in the `admins` table.

Public routes use anon. Admin routes use server-client. Never mix.

## Public route caching

Public routes (`/`, `/listing/[id]`) set `export const dynamic = 'force-dynamic'` so a fresh read runs on every request — edits to live listings must show on the next page load.

Admin server actions that mutate listings must call `revalidatePath('/')` and, for per-listing edits, `revalidatePath('/listing/${id}')`.

## Photos

- Use plain `<img>`, NEVER `next/image`. Photos come from arbitrary external hosts; `next/image` requires every host in `next.config.mjs` `remotePatterns` and would block every new agent CDN behind a code change + redeploy.
- The description field is rendered as React text children with `whitespace-pre-wrap`. NEVER `dangerouslySetInnerHTML`.

## Tests

- `tests/` at the app root.
- Pure-function tests on schemas, `parsePhotoUrls`, `validateForPublish`.
- Action tests against a `FakeListingService` implementing the contract — fakes, not mocks.
- Frontend components: implement directly, no TDD.
- Every new function gets a test; modified functions get their test created or updated. Scope is the touched function only; do not backfill.

## Admin auth gate (Unit 3 onwards)

Every admin server action calls `authService.requireAdmin()` as its first line. The Next.js middleware does NOT execute for server actions invoked from non-admin paths, so each action is its own gate. `requireAdmin()` checks both the Supabase session AND membership in the `admins` table.

## SQL migrations

- Live in `supabase/migrations/`.
- Numbered `0001_*`, `0002_*`, …
- Run via `npx supabase db push`. Never via the SQL editor — that breaks the migration lineage.

## Comments

Default to no comments. Only add a comment when the WHY is non-obvious: a hidden constraint, a workaround, behavior that would surprise the next reader. Never WHAT the code does — well-named identifiers do that.
