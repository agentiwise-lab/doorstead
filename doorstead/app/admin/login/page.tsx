import { redirect } from 'next/navigation'
import { authService } from '@/lib/auth/service'
import { LoginForm } from './LoginForm'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  const session = await authService.getSession()
  if (session) {
    // isAdmin() now throws on a query error (see lib/auth/service.ts) so callers
    // can fail closed; here that just means falling through to the login form,
    // matching this page's prior behavior when the check couldn't be confirmed.
    const isAdmin = await authService.isAdmin(session.userId).catch(() => false)
    if (isAdmin) redirect('/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">
          Admin sign in
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Marlowe &amp; Hart staff only.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
