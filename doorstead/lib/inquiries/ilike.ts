// PostgREST's .ilike() compiles to SQL LIKE, where % and _ are wildcards.
// An email's local part may legally contain either, so they must be escaped
// or a query for "a_b@x.com" could also match an unrelated "aXb@x.com" —
// harmless here only because inquiries_buyer_read (migration 0007) still
// independently re-checks lower(email) = lower(jwt email) as an exact
// match, but escaping keeps this filter's own intent correct rather than
// leaning on that second layer to paper over it.
//
// Kept in its own module with no DB imports so it stays a pure unit: a test
// can exercise it without loading anon-client, which throws at import when
// the Supabase env vars are absent.
export const escapeForIlike = (value: string): string =>
  value.replace(/[\\%_]/g, (char) => `\\${char}`)
