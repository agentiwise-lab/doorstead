import { notFound } from 'next/navigation'
import { listingService } from '@/lib/listings/service'
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

  return <ListingDetail listing={listing} />
}
