import { sanitizeNextPath } from '@/lib/auth/next-path'
import { SignInForm } from './SignInForm'

export const dynamic = 'force-dynamic'

export default function SignInPage({
  searchParams,
}: {
  searchParams: { next?: string }
}) {
  const next = sanitizeNextPath(searchParams.next)

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
          Marlowe &amp; Hart
        </p>
        <h1 className="mt-3 font-display text-xl font-semibold text-brand-900">
          Sign in to save properties
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Sign in with Google to build your shortlist.
        </p>
        <div className="mt-6">
          <SignInForm next={next} />
        </div>
      </div>
    </div>
  )
}
