import type { ListingStatus } from '@/lib/listings/contract'

const STYLES: Record<ListingStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 ring-gray-200',
  live: 'bg-green-100 text-green-800 ring-green-200',
}

export function StatusBadge({ status }: { status: ListingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {status}
    </span>
  )
}
