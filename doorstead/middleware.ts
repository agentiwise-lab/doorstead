import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const client = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    })

    // Touch the auth state so the session cookie is refreshed on every admin request.
    // getUser verifies the JWT, unlike getSession.
    await client.auth.getUser()
  }

  // No-store on every admin response means the browser bfcache cannot revive a logged-in
  // page after logout, and proxies cannot serve a cached copy to another user.
  response.headers.set('Cache-Control', 'no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')

  return response
}

export const config = {
  // Matches /admin and every nested path EXCEPT /admin/login (which must stay reachable
  // when unauthenticated). The negative lookahead also lets /admin/login render fast
  // without a redundant session refresh.
  matcher: ['/admin', '/admin/((?!login(?:/.*)?$).*)'],
}
