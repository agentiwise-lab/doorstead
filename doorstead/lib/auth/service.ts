import 'server-only'
import { headers } from 'next/headers'
import { createServerClient } from '@/lib/db/server-client'
import type { AuthService, Session, SignInResult } from './contract'

export class DefaultAuthService implements AuthService {
  async signIn(email: string, password: string): Promise<SignInResult> {
    const client = createServerClient()
    const { error } = await client.auth.signInWithPassword({ email, password })

    if (error) {
      // Supabase returns a 400 with message "Invalid login credentials" for both
      // unknown email and wrong password. Collapse anything credential-shaped
      // into a single generic error so the UI never discloses which field is wrong.
      const status = (error as { status?: number }).status
      const message = (error.message ?? '').toLowerCase()
      if (status === 400 || message.includes('credential') || message.includes('invalid')) {
        return { ok: false, error: 'invalid_credentials' }
      }
      throw error
    }

    return { ok: true }
  }

  async signOut(): Promise<void> {
    const client = createServerClient()
    await client.auth.signOut()
  }

  async getSession(): Promise<Session | null> {
    const client = createServerClient()
    // getUser verifies the JWT against the auth server, unlike getSession which
    // trusts the cookie blindly. Use getUser anywhere a security boundary depends on it.
    const { data, error } = await client.auth.getUser()
    if (error || !data.user || !data.user.email) return null
    return { userId: data.user.id, email: data.user.email }
  }

  async isAdmin(userId: string): Promise<boolean> {
    const client = createServerClient()
    const { data, error } = await client
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return data !== null
  }

  async requireAdmin(): Promise<Session> {
    const session = await this.getSession()
    if (!session) throw new Error('Unauthorized')
    const ok = await this.isAdmin(session.userId).catch(() => false)
    if (!ok) throw new Error('Unauthorized')
    return session
  }

  async requireBuyer(): Promise<Session> {
    const session = await this.getSession()
    if (!session) throw new Error('Unauthorized')
    const admin = await this.isAdmin(session.userId).catch(() => true)
    if (admin) throw new Error('Unauthorized')
    return session
  }

  async getGoogleSignInUrl(nextPath: string): Promise<string> {
    const headerList = headers()
    const host = headerList.get('host') ?? 'localhost:3000'
    const proto =
      headerList.get('x-forwarded-proto') ??
      (host.startsWith('localhost') ? 'http' : 'https')
    const origin = `${proto}://${host}`
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`

    const client = createServerClient()
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })

    if (error) throw error
    if (!data.url) throw new Error('Google sign-in URL was not returned')
    return data.url
  }

  async exchangeCodeForSession(code: string): Promise<boolean> {
    if (!code) return false
    const client = createServerClient()
    const { error } = await client.auth.exchangeCodeForSession(code)
    return !error
  }
}

export const authService: AuthService = new DefaultAuthService()
