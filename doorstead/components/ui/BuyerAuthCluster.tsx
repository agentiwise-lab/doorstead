import Link from 'next/link'
import type { Session } from '@/lib/auth/contract'
import { buyerLogout } from '@/lib/auth/actions'

const linkClass = 'font-medium text-brand-700 transition hover:text-brand-900'

export function BuyerAuthCluster({ session }: { session: Session | null }) {
  if (!session) {
    return (
      <Link
        href="/sign-in"
        className="rounded-md border border-brand-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:border-brand-300 hover:bg-brand-50"
      >
        Sign in with Google
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <Link href="/shortlist" className={linkClass}>
        My shortlist
      </Link>
      <Link href="/my-inquiries" className={linkClass}>
        My inquiries
      </Link>
      <form action={buyerLogout}>
        <button type="submit" className={linkClass}>
          Sign out
        </button>
      </form>
    </div>
  )
}
