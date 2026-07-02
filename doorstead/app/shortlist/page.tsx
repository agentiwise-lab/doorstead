import { redirect } from 'next/navigation'
import { authService } from '@/lib/auth/service'
import { buyerService } from '@/lib/buyers/service'
import { ListingCard } from '@/components/listing/ListingCard'
import { PublicHeader } from '@/components/ui/PublicHeader'

export const dynamic = 'force-dynamic'

export default async function ShortlistPage() {
  let buyerId: string
  try {
    const session = await authService.requireBuyer()
    buyerId = session.userId
  } catch {
    redirect('/sign-in?next=%2Fshortlist')
  }

  const listings = await buyerService.listShortlist(buyerId)

  return (
    <div className="min-h-screen bg-brand-50">
      <PublicHeader contextLabel="Your shortlist" />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-6 py-16 text-center">
            <h2 className="font-display text-xl font-semibold text-brand-900">
              Nothing saved yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
              Save a property from its listing page and it will show up here.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <ListingCard listing={listing} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
