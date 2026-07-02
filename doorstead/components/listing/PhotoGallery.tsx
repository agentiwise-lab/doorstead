'use client'

import { useEffect, useState } from 'react'
import type { RenderImage } from '@/lib/listings/contract'

export function PhotoGallery({
  images,
  alt,
}: {
  images: RenderImage[]
  alt: string
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    setSelectedIndex(0)
  }, [images])

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl border border-brand-100 bg-brand-100/60 text-sm font-medium text-brand-600/70">
        No photos available
      </div>
    )
  }

  const safeIndex = Math.min(selectedIndex, images.length - 1)
  const selected = images[safeIndex]

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <div className="min-w-0 flex-1">
          <img
            src={selected.url}
            alt={`${alt} (photo ${safeIndex + 1})`}
            className="aspect-[4/3] w-full rounded-2xl bg-brand-100 object-cover shadow-sm"
            loading="eager"
          />
        </div>

        {images.length > 1 && (
          <div className="flex flex-row gap-2 overflow-x-auto sm:w-28 sm:max-h-96 sm:min-h-0 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto">
            {images.map((image, index) => (
              <button
                key={image.thumbUrl}
                type="button"
                onClick={() => setSelectedIndex(index)}
                aria-label={`View photo ${index + 1}`}
                aria-pressed={index === safeIndex}
                className={[
                  'flex-shrink-0 overflow-hidden rounded-xl bg-brand-100 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                  'h-16 w-24 sm:h-20 sm:w-full',
                  index === safeIndex
                    ? 'ring-2 ring-brand-600 ring-offset-1'
                    : 'opacity-70 hover:opacity-100',
                ].join(' ')}
              >
                <img
                  src={image.thumbUrl}
                  alt={`${alt} (photo ${index + 1})`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <noscript>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {images.map((image, index) => (
            <img
              key={image.url}
              src={image.url}
              alt={`${alt} (photo ${index + 1})`}
              className="aspect-[4/3] w-full rounded-2xl bg-brand-100 object-cover shadow-sm"
            />
          ))}
        </div>
      </noscript>
    </>
  )
}
