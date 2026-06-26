import Link from 'next/link'
import { redirect } from 'next/navigation'
import { authService } from '@/lib/auth/service'
import { LogoutButton } from '@/components/admin/LogoutButton'

// force-dynamic prevents Next from attempting to statically render the admin shell.
// Combined with the Cache-Control header set in middleware, this ensures every admin
// request executes the auth check and never serves a stale response.
export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let email: string
  try {
    const session = await authService.requireAdmin()
    email = session.email
  } catch {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-baseline gap-6">
            <span className="text-lg font-semibold tracking-tight text-gray-900">
              Doorstead Admin
            </span>
            <nav className="flex items-baseline gap-4 text-sm">
              <Link
                href="/admin"
                className="font-medium text-gray-600 hover:text-gray-900"
              >
                Listings
              </Link>
              <Link
                href="/admin/inquiries"
                className="font-medium text-gray-600 hover:text-gray-900"
              >
                Inquiries
              </Link>
            </nav>
            <span className="text-sm text-gray-500">{email}</span>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
