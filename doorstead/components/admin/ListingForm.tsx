'use client'

import { useFormState, useFormStatus } from 'react-dom'
import type { ListingInput, ListingStatus } from '@/lib/listings/contract'
import type { UpdateListingState } from '@/lib/listings/actions'
import { ListingFields } from './ListingFields'

const PUBLISH_GUARD_MESSAGE = 'Required to publish.'

function SubmitButtons({ initialStatus }: { initialStatus: ListingStatus }) {
  const { pending } = useFormStatus()
  const baseClass =
    'rounded px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60'
  const isLive = initialStatus === 'live'

  return (
    <div className="flex gap-3">
      <button
        type="submit"
        name="intent"
        value={initialStatus}
        disabled={pending}
        className={`${baseClass} border border-gray-300 bg-white text-gray-800 hover:bg-gray-50`}
      >
        {pending ? 'Saving…' : 'Save changes'}
      </button>
      <button
        type="submit"
        name="intent"
        value={isLive ? 'draft' : 'live'}
        disabled={pending}
        className={`${baseClass} bg-gray-900 text-white hover:bg-gray-800`}
      >
        {isLive ? 'Unpublish' : 'Publish'}
      </button>
    </div>
  )
}

export type ListingFormProps = {
  action: (
    state: UpdateListingState,
    formData: FormData,
  ) => Promise<UpdateListingState>
  initialValues?: Partial<ListingInput>
  initialStatus?: ListingStatus
  hiddenFields?: Record<string, string>
  missingFields?: string[]
}

// The edit form owns only the text/number fields. Photos live in EditPhotos,
// which manages persisted media directly against listing_media.
export function ListingForm({
  action,
  initialValues,
  initialStatus = 'draft',
  hiddenFields,
  missingFields,
}: ListingFormProps) {
  const [state, formAction] = useFormState<UpdateListingState, FormData>(action, {
    fieldErrors: {},
  })

  const errors = state.fieldErrors ?? {}
  const missing = new Set(missingFields ?? [])

  const errorFor = (field: string): string | undefined => {
    if (errors[field]) return errors[field]
    if (missing.has(field)) return PUBLISH_GUARD_MESSAGE
    return undefined
  }

  return (
    <form action={formAction} className="space-y-5">
      {missing.size > 0 && (
        <div
          role="alert"
          className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          Cannot publish. Fix these fields and save again.
        </div>
      )}
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

      <ListingFields initialValues={initialValues} errorFor={errorFor} />

      <SubmitButtons initialStatus={initialStatus} />
    </form>
  )
}
