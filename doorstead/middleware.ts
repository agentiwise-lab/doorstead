import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  let user = null

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

    // Touch the auth state so a rotated session cookie is persisted through the
    // set() callback above. This is the ONLY place a rotated refresh token gets
    // written back, because Server Components cannot set cookies. With refresh-
    // token rotation on, an authenticated user whose routes never ran this
    // middleware would be silently signed out at the JWT TTL, so it must run on
    // every authenticated route (admin AND buyer), not just /admin. getUser
    // verifies the JWT, unlike getSession.
    const result = await client.auth.getUser()
    user = result.data.user
  }

  // No-store only on authenticated responses: the browser bfcache cannot revive
  // a signed-in page (admin or buyer) after logout, and proxies cannot serve a
  // cached copy to another user. Anonymous responses stay cacheable.
  if (user) {
    response.headers.set('Cache-Control', 'no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
  }

  return response
}

export const config = {
  // Run on every request except Next internals and static assets, so the session
  // cookie is refreshed on admin AND buyer routes. Route protection itself lives
  // in the pages/actions (requireAdmin / requireBuyer); this middleware only
  // keeps the session alive and marks authenticated responses no-store.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
