'use client'

import { useState } from 'react'

export function PhotoGallery({
  photoUrls,
  alt,
}: {
  photoUrls: string[]
  alt: string
}) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (photoUrls.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl border border-brand-100 bg-brand-100/60 text-sm font-medium text-brand-600/70">
        No photos available
      </div>
    )
  }

  const selectedUrl = photoUrls[selectedIndex]

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
      {/* Primary large image */}
      <div className="min-w-0 flex-1">
        <img
          src={selectedUrl}
          alt={`${alt} (photo ${selectedIndex + 1})`}
          className="aspect-[4/3] w-full rounded-2xl bg-brand-100 object-cover shadow-sm"
          loading="eager"
        />
      </div>

      {/* Thumbnail strip — only rendered when there is more than one photo */}
      {photoUrls.length > 1 && (
        <div className="flex flex-row gap-2 overflow-x-auto sm:w-28 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto">
          {photoUrls.map((url, index) => (
            <button
              key={`${index}-${url}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`View photo ${index + 1}`}
              aria-pressed={index === selectedIndex}
              className={[
                'flex-shrink-0 overflow-hidden rounded-xl bg-brand-100 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                'h-16 w-24 sm:h-20 sm:w-full',
                index === selectedIndex
                  ? 'ring-2 ring-brand-600 ring-offset-1'
                  : 'opacity-70 hover:opacity-100',
              ].join(' ')}
            >
              <img
                src={url}
                alt={`${alt} (photo ${index + 1})`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
