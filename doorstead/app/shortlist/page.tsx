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

  const entries = await buyerService.listShortlist(session.userId)

  // Resolve a cover only for entries whose listing is still available. An
  // unavailable entry (unpublished or deleted) renders as a placeholder the
  // buyer can unsave, rather than being silently dropped from the shortlist.
  const cards = await Promise.all(
    entries.map(async (entry) => ({
      entry,
      coverThumbUrl: entry.listing
        ? coverThumbUrl(
            await listingService.getImagesForRender(entry.listing.id, 'public'),
          )
        : null,
    })),
  )

  return (
    <div className="min-h-screen bg-brand-50">
      <PublicHeader contextLabel="Your shortlist" session={session} />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {entries.length === 0 ? (
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
            {cards.map(({ entry, coverThumbUrl }) =>
              entry.listing ? (
                <li key={entry.listingId}>
                  <ListingCard
                    listing={entry.listing}
                    coverThumbUrl={coverThumbUrl}
                    saveControl={
                      <SaveListingButton
                        listingId={entry.listing.id}
                        isSaved
                        redirectTo="/shortlist"
                      />
                    }
                  />
                </li>
              ) : (
                <li key={entry.listingId}>
                  <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-white p-6 text-center">
                    <p className="font-display text-lg font-semibold text-brand-900">
                      No longer listed
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      This saved property has been removed or unpublished.
                    </p>
                    <div className="mt-4">
                      <SaveListingButton
                        listingId={entry.listingId}
                        isSaved
                        redirectTo="/shortlist"
                      />
                    </div>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </main>
    </div>
  )
}
