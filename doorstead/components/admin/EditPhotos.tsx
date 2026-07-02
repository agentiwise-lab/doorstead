'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminImage } from '@/lib/listings/contract'
import {
  removeListingImage,
  reorderListingImages,
  setListingCover,
  setListingFloorplan,
  uploadListingImage,
} from '@/lib/listings/actions'
import { PhotoDropzone, type StagedPhoto } from './PhotoDropzone'

const CONTROL_CLASS =
  'rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40'

const BADGE_CLASS =
  'rounded bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white'

// The edit surface manages persisted media: each tile drives reorder, cover,
// floorplan, and remove through the existing server actions (each a small form
// post that redirects back here with fresh state). New files upload through the
// dropzone against the listing id, then a refresh re-renders the grid.
export function EditPhotos({
  listingId,
  images,
}: {
  listingId: string
  images: AdminImage[]
}) {
  const router = useRouter()
  const [staged, setStaged] = useState<StagedPhoto[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ids = images.map((image) => image.id)
  const orderAfterSwap = (index: number, direction: 'up' | 'down'): string => {
    const next = [...ids]
    const target = direction === 'up' ? index - 1 : index + 1
    ;[next[index], next[target]] = [next[target], next[index]]
    return next.join(',')
  }

  const uploadStaged = async () => {
    if (staged.length === 0 || pending) return
    setPending(true)
    setError(null)
    try {
      for (const photo of staged) {
        const fd = new FormData()
        fd.append('id', listingId)
        fd.append('image', photo.file)
        const result = await uploadListingImage(fd)
        if (!result.ok) {
          setError(result.error.message)
          break
        }
      }
      setStaged([])
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="mt-8 rounded border border-gray-200 p-4">
      <h2 className="text-sm font-medium text-gray-700">Photos</h2>

      {images.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="overflow-hidden rounded border border-gray-200"
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.thumbUrl}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="absolute left-1 top-1 flex gap-1">
                  {image.isCover && <span className={BADGE_CLASS}>Cover</span>}
                  {image.isFloorplan && (
                    <span className={BADGE_CLASS}>Floorplan</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1 p-2">
                <form action={reorderListingImages}>
                  <input type="hidden" name="id" value={listingId} />
                  <input
                    type="hidden"
                    name="orderedImageIds"
                    value={orderAfterSwap(index, 'up')}
                  />
                  <button
                    type="submit"
                    disabled={index === 0}
                    aria-label="Move earlier"
                    className={CONTROL_CLASS}
                  >
                    ↑
                  </button>
                </form>
                <form action={reorderListingImages}>
                  <input type="hidden" name="id" value={listingId} />
                  <input
                    type="hidden"
                    name="orderedImageIds"
                    value={orderAfterSwap(index, 'down')}
                  />
                  <button
                    type="submit"
                    disabled={index === images.length - 1}
                    aria-label="Move later"
                    className={CONTROL_CLASS}
                  >
                    ↓
                  </button>
                </form>
                <form action={setListingCover}>
                  <input type="hidden" name="id" value={listingId} />
                  <input type="hidden" name="imageId" value={image.id} />
                  <button
                    type="submit"
                    disabled={image.isCover}
                    className={CONTROL_CLASS}
                  >
                    Cover
                  </button>
                </form>
                <form action={setListingFloorplan}>
                  <input type="hidden" name="id" value={listingId} />
                  <input type="hidden" name="imageId" value={image.id} />
                  <button
                    type="submit"
                    disabled={image.isFloorplan}
                    className={CONTROL_CLASS}
                  >
                    Floorplan
                  </button>
                </form>
                <form action={removeListingImage}>
                  <input type="hidden" name="id" value={listingId} />
                  <input type="hidden" name="imageId" value={image.id} />
                  <button
                    type="submit"
                    className={`${CONTROL_CLASS} text-red-600 hover:bg-red-50`}
                  >
                    Remove
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-3">
        <PhotoDropzone staged={staged} onChange={setStaged} disabled={pending} />
        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}
        {staged.length > 0 && (
          <button
            type="button"
            onClick={uploadStaged}
            disabled={pending}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending
              ? 'Uploading…'
              : `Upload ${staged.length} photo${staged.length > 1 ? 's' : ''}`}
          </button>
        )}
      </div>
    </section>
  )
}
