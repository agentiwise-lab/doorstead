import { NextResponse, type NextRequest } from 'next/server'
import { authService } from '@/lib/auth/service'
import { sanitizeNextPath } from '@/lib/auth/next-path'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (!code) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  const ok = await authService.exchangeCodeForSession(code)
  if (!ok) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return NextResponse.redirect(new URL(sanitizeNextPath(next), request.url))
}
