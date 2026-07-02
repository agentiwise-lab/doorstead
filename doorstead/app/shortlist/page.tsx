import { redirect } from 'next/navigation'
import { authService } from '@/lib/auth/service'
import type { Session } from '@/lib/auth/contract'
import { buyerService } from '@/lib/buyers/service'
import { listingService } from '@/lib/listings/service'
import { coverThumbUrl } from '@/lib/listings/render'
import { ListingCard } from '@/components/listing/ListingCard'
import { SaveListingButton } from '@/components/listing/SaveListingButton'
import { PublicHeader } from '@/components/ui/PublicHeader'

export const dynamic = 'force-dynamic'

export default async function ShortlistPage() {
  let session: Session
  try {
    session = await authService.requireBuyer()
  } catch {
    redirect('/sign-in?next=%2Fshortlist')
  }

  const listings = await buyerService.listShortlist(session.userId)

  // Resolve each saved card's cover through the same render path the home grid
  // and gallery use, so a stored-only or legacy-only listing shows a cover.
  const cards = await Promise.all(
    listings.map(async (listing) => ({
      listing,
      coverThumbUrl: coverThumbUrl(
        await listingService.getImagesForRender(listing.id, 'public'),
      ),
    })),
  )

  return (
    <div className="min-h-screen bg-brand-50">
      <PublicHeader contextLabel="Your shortlist" session={session} />

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
            {cards.map(({ listing, coverThumbUrl }) => (
              <li key={listing.id}>
                <ListingCard
                  listing={listing}
                  coverThumbUrl={coverThumbUrl}
                  saveControl={
                    <SaveListingButton
                      listingId={listing.id}
                      isSaved
                      redirectTo="/shortlist"
                    />
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
