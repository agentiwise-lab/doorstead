'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import type {
  ListingInput,
  ListingStatus,
  ListingType,
} from '@/lib/listings/contract'
import type {
  CreateListingState,
  UpdateListingState,
} from '@/lib/listings/actions'
import { serializePhotoUrls } from '@/lib/listings/photo-urls'
import { ImageUrlList } from './ImageUrlList'

type FormState = CreateListingState | UpdateListingState

const LISTING_TYPES: readonly ListingType[] = [
  'House',
  'Flat',
  'Bungalow',
  'Maisonette',
  'Land',
  'Other',
]

export type ListingFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  initialValues?: Partial<ListingInput>
  initialStatus?: ListingStatus
  mode?: 'create' | 'update'
  hiddenFields?: Record<string, string>
  missingFields?: string[]
}

const PUBLISH_GUARD_MESSAGE = 'Required to publish.'

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

export function ListingForm({
  action,
  initialValues,
  initialStatus = 'draft',
  mode = 'create',
  hiddenFields,
  missingFields,
}: ListingFormProps) {
  const [state, formAction] = useFormState<FormState, FormData>(action, {
    fieldErrors: {},
  })
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    initialValues?.photoUrls ?? [],
  )

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
          Cannot publish — fix these fields and save again.
        </div>
      )}
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
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
        <FieldError message={errorFor('address')} />
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
        <FieldError message={errorFor('type')} />
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
          <FieldError message={errorFor('priceGbp')} />
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
          <FieldError message={errorFor('areaSqft')} />
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
          <FieldError message={errorFor('beds')} />
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
          <FieldError message={errorFor('baths')} />
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
        <FieldError message={errorFor('description')} />
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700">
          Photo URLs
        </legend>
        <input
          type="hidden"
          name="photoUrls"
          value={serializePhotoUrls(photoUrls)}
        />
        <div className="mt-1">
          <ImageUrlList urls={photoUrls} onChange={setPhotoUrls} />
        </div>
        <FieldError message={errorFor('photoUrls')} />
      </fieldset>

      <SubmitButtons mode={mode} initialStatus={initialStatus} />
    </form>
  )
}
