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
