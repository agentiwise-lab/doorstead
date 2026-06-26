'use client'

import { deleteListing } from '@/lib/listings/actions'

type Props = {
  listingId: string
  address: string | null
}

export function ConfirmDeleteButton({ listingId, address }: Props) {
  const label = address ?? 'this listing'
  return (
    <form
      action={deleteListing}
      onSubmit={(e) => {
        if (
          !window.confirm(`Delete ${label}? This cannot be undone.`)
        ) {
          e.preventDefault()
        }
      }}
      className="inline"
    >
      <input type="hidden" name="id" value={listingId} />
      <button
        type="submit"
        className="text-sm text-red-600 underline hover:text-red-800"
      >
        Delete
      </button>
    </form>
  )
}
