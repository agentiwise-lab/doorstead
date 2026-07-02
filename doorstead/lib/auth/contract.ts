export type Session = { userId: string; email: string }

export type SignInResult =
  | { ok: true }
  | { ok: false; error: 'invalid_credentials' }

export interface AuthService {
  signIn(email: string, password: string): Promise<SignInResult>
  signOut(): Promise<void>
  getSession(): Promise<Session | null>
  requireAdmin(): Promise<Session>
  requireBuyer(): Promise<Session>
  isAdmin(userId: string): Promise<boolean>
  getGoogleSignInUrl(nextPath: string): Promise<string>
  exchangeCodeForSession(code: string): Promise<boolean>
}
