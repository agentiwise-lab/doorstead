'use client'

import { useFormState, useFormStatus } from 'react-dom'
import type {
  ListingInput,
  ListingStatus,
  ListingType,
} from '@/lib/listings/contract'
import type { CreateListingState } from '@/lib/listings/actions'

const LISTING_TYPES: readonly ListingType[] = [
  'House',
  'Flat',
  'Bungalow',
  'Maisonette',
  'Land',
  'Other',
]

export type ListingFormProps = {
  action: (
    state: CreateListingState,
    formData: FormData,
  ) => Promise<CreateListingState>
  initialValues?: Partial<ListingInput>
  initialStatus?: ListingStatus
  mode?: 'create' | 'update'
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1 text-sm text-red-600">
      {message}
    </p>
  )
}

function SubmitButtons({
  mode,
  initialStatus,
}: {
  mode: 'create' | 'update'
  initialStatus: ListingStatus
}) {
  const { pending } = useFormStatus()
  const baseClass =
    'rounded px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60'

  if (mode === 'create') {
    return (
      <div className="flex gap-3">
        <button
          type="submit"
          name="intent"
          value="draft"
          disabled={pending}
          className={`${baseClass} border border-gray-300 bg-white text-gray-800 hover:bg-gray-50`}
        >
          {pending ? 'Saving…' : 'Save as draft'}
        </button>
        <button
          type="submit"
          name="intent"
          value="live"
          disabled={pending}
          className={`${baseClass} bg-gray-900 text-white hover:bg-gray-800`}
        >
          {pending ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    )
  }

  const isLive = initialStatus === 'live'
  return (
    <div className="flex gap-3">
      <button
        type="submit"
        name="intent"
        value="draft"
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

export function ListingForm({
  action,
  initialValues,
  initialStatus = 'draft',
  mode = 'create',
}: ListingFormProps) {
  const [state, formAction] = useFormState<CreateListingState, FormData>(
    action,
    { fieldErrors: {} },
  )

  const errors = state.fieldErrors ?? {}
  const initialPhotos = (initialValues?.photoUrls ?? []).join('\n')

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="address"
          className="block text-sm font-medium text-gray-700"
        >
          Address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={initialValues?.address ?? ''}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
        <FieldError message={errors.address} />
      </div>

      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium text-gray-700"
        >
          Type
        </label>
        <select
          id="type"
          name="type"
          defaultValue={initialValues?.type ?? ''}
          className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        >
          <option value="">Select type</option>
          {LISTING_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <FieldError message={errors.type} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="priceGbp"
            className="block text-sm font-medium text-gray-700"
          >
            Price (GBP)
          </label>
          <input
            id="priceGbp"
            name="priceGbp"
            type="number"
            min="0"
            step="1"
            defaultValue={initialValues?.priceGbp ?? ''}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
          <FieldError message={errors.priceGbp} />
        </div>
        <div>
          <label
            htmlFor="areaSqft"
            className="block text-sm font-medium text-gray-700"
          >
            Area (sqft)
          </label>
          <input
            id="areaSqft"
            name="areaSqft"
            type="number"
            min="0"
            step="1"
            defaultValue={initialValues?.areaSqft ?? ''}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
          <FieldError message={errors.areaSqft} />
        </div>
        <div>
          <label
            htmlFor="beds"
            className="block text-sm font-medium text-gray-700"
          >
            Beds
          </label>
          <input
            id="beds"
            name="beds"
            type="number"
            min="0"
            step="1"
            defaultValue={initialValues?.beds ?? ''}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
          <FieldError message={errors.beds} />
        </div>
        <div>
          <label
            htmlFor="baths"
            className="block text-sm font-medium text-gray-700"
          >
            Baths
          </label>
          <input
            id="baths"
            name="baths"
            type="number"
            min="0"
            step="1"
            defaultValue={initialValues?.baths ?? ''}
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
          <FieldError message={errors.baths} />
        </div>
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={initialValues?.description ?? ''}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
        <FieldError message={errors.description} />
      </div>

      <div>
        <label
          htmlFor="photoUrls"
          className="block text-sm font-medium text-gray-700"
        >
          Photo URLs
        </label>
        <p className="mt-1 text-xs text-gray-500">One URL per line.</p>
        <textarea
          id="photoUrls"
          name="photoUrls"
          rows={6}
          defaultValue={initialPhotos}
          className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
        <FieldError message={errors.photoUrls} />
      </div>

      <SubmitButtons mode={mode} initialStatus={initialStatus} />
    </form>
  )
}
