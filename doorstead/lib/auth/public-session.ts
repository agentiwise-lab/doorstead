import type { Session } from './contract'

// PublicHeader's buyer cluster ("My shortlist" / "My inquiries" / sign out)
// is a dead end for an admin session: requireBuyer() correctly rejects
// admins, bouncing them to /sign-in in a loop. An admin session must render
// as if signed out on public pages.
export function resolveHeaderSession(
  session: Session | null,
  isAdmin: boolean,
): Session | null {
  if (!session) return null
  return isAdmin ? null : session
}

// Resolves the header session while tolerating an isAdmin check that errors.
// A transient admin-membership error must NOT hide a signed-in buyer's own
// header: fall back to non-admin so the buyer keeps their cluster. Do not alias
// the error to "is admin" (which would drop the buyer's session). An admin who
// slips through on an error only sees buyer nav links, and requireBuyer() still
// rejects them, so this never grants a capability.
export async function resolveHeaderSessionFor(
  session: Session | null,
  isAdmin: (userId: string) => Promise<boolean>,
): Promise<Session | null> {
  if (!session) return null
  const admin = await isAdmin(session.userId).catch(() => false)
  return resolveHeaderSession(session, admin)
}
