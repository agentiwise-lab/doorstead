import { notFound } from 'next/navigation'
import { listingService } from '@/lib/listings/service'
import { authService } from '@/lib/auth/service'
import { buyerService } from '@/lib/buyers/service'
import { ListingDetail } from '@/components/listing/ListingDetail'

export const dynamic = 'force-dynamic'

export default async function ListingDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const listing = await listingService.getById(params.id)

  if (!listing || listing.status !== 'live') {
    notFound()
  }

  const session = await authService.getSession()
  const isSaved = session
    ? (await buyerService.savedListingIds(session.userId, [listing.id])).has(
        listing.id,
      )
    : false

  return <ListingDetail listing={listing} isSaved={isSaved} />
}
