import type { ListingInput, ListingType } from '@/lib/listings/contract'

const LISTING_TYPES: readonly ListingType[] = [
  'House',
  'Flat',
  'Bungalow',
  'Maisonette',
  'Land',
  'Other',
]

const FIELD_CLASS =
  'mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500'

const LABEL_CLASS = 'block text-sm font-medium text-gray-700'

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1 text-sm text-red-600">
      {message}
    </p>
  )
}

// The text/number fields a listing owns. Both the create and edit forms render
// these; photos are handled separately (they upload to listing_media, not the
// form body). errorFor lets each form surface its own validation state.
export function ListingFields({
  initialValues,
  errorFor,
}: {
  initialValues?: Partial<ListingInput>
  errorFor: (field: string) => string | undefined
}) {
  return (
    <>
      <div>
        <label htmlFor="address" className={LABEL_CLASS}>
          Address
        </label>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={initialValues?.address ?? ''}
          className={FIELD_CLASS}
        />
        <FieldError message={errorFor('address')} />
      </div>

      <div>
        <label htmlFor="type" className={LABEL_CLASS}>
          Type
        </label>
        <select
          id="type"
          name="type"
          defaultValue={initialValues?.type ?? ''}
          className={`${FIELD_CLASS} bg-white`}
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
          <label htmlFor="priceGbp" className={LABEL_CLASS}>
            Price (GBP)
          </label>
          <input
            id="priceGbp"
            name="priceGbp"
            type="number"
            min="0"
            step="1"
            defaultValue={initialValues?.priceGbp ?? ''}
            className={FIELD_CLASS}
          />
          <FieldError message={errorFor('priceGbp')} />
        </div>
        <div>
          <label htmlFor="areaSqft" className={LABEL_CLASS}>
            Area (sqft)
          </label>
          <input
            id="areaSqft"
            name="areaSqft"
            type="number"
            min="0"
            step="1"
            defaultValue={initialValues?.areaSqft ?? ''}
            className={FIELD_CLASS}
          />
          <FieldError message={errorFor('areaSqft')} />
        </div>
        <div>
          <label htmlFor="beds" className={LABEL_CLASS}>
            Beds
          </label>
          <input
            id="beds"
            name="beds"
            type="number"
            min="0"
            step="1"
            defaultValue={initialValues?.beds ?? ''}
            className={FIELD_CLASS}
          />
          <FieldError message={errorFor('beds')} />
        </div>
        <div>
          <label htmlFor="baths" className={LABEL_CLASS}>
            Baths
          </label>
          <input
            id="baths"
            name="baths"
            type="number"
            min="0"
            step="1"
            defaultValue={initialValues?.baths ?? ''}
            className={FIELD_CLASS}
          />
          <FieldError message={errorFor('baths')} />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={LABEL_CLASS}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={initialValues?.description ?? ''}
          className={FIELD_CLASS}
        />
        <FieldError message={errorFor('description')} />
      </div>
    </>
  )
}
