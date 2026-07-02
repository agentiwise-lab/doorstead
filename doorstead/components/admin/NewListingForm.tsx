'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createListing,
  publishListing,
  uploadListingImage,
} from '@/lib/listings/actions'
import { ListingFields } from './ListingFields'
import { PhotoDropzone, type StagedPhoto } from './PhotoDropzone'

// Create can't upload inline: images need a listing id that doesn't exist yet.
// So this form stages files client-side, then on save it creates the draft,
// uploads each staged file to the new id, and (for Publish) flips it live once
// the photos have landed. Cover and floorplan are chosen later on the edit page.
export function NewListingForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [staged, setStaged] = useState<StagedPhoto[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const submit = async (intent: 'draft' | 'live') => {
    if (!formRef.current || pending) return
    const fd = new FormData(formRef.current)
    setPending(true)
    setUploadError(null)
    try {
      const created = await createListing(fd)
      if (!created.ok) {
        setFieldErrors(created.fieldErrors)
        return
      }
      setFieldErrors({})

      for (const photo of staged) {
        const upload = new FormData()
        upload.append('id', created.id)
        upload.append('image', photo.file)
        const result = await uploadListingImage(upload)
        if (!result.ok) {
          // The draft exists with whatever uploaded so far; send the user to the
          // edit screen to resolve it rather than losing their work.
          setUploadError(result.error.message)
          router.push(`/admin/${created.id}/edit`)
          return
        }
      }

      if (intent === 'live') {
        const publish = new FormData()
        publish.append('id', created.id)
        await publishListing(publish)
        return
      }
      router.push('/admin')
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      ref={formRef}
      className="space-y-5"
      onSubmit={(e) => e.preventDefault()}
    >
      <ListingFields errorFor={(field) => fieldErrors[field]} />

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700">
          Photos
        </legend>
        <p className="mb-2 mt-1 text-xs text-gray-500">
          Photos attach when you save. Set the cover and floorplan afterwards, on
          the edit screen.
        </p>
        <PhotoDropzone staged={staged} onChange={setStaged} disabled={pending} />
      </fieldset>

      {uploadError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {uploadError}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => submit('draft')}
          disabled={pending}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save as draft'}
        </button>
        <button
          type="button"
          onClick={() => submit('live')}
          disabled={pending}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </form>
  )
}
