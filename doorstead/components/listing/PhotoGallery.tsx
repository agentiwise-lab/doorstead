export function PhotoGallery({
  photoUrls,
  alt,
}: {
  photoUrls: string[]
  alt: string
}) {
  if (photoUrls.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl border border-brand-100 bg-brand-100/60 text-sm font-medium text-brand-600/70">
        No photos available
      </div>
    )
  }

  const [hero, ...rest] = photoUrls

  return (
    <div className="flex flex-col gap-3">
      <img
        src={hero}
        alt={`${alt} (photo 1)`}
        className="w-full rounded-2xl bg-brand-100 object-cover shadow-sm"
        loading="eager"
      />
      {rest.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rest.map((url, index) => (
            <img
              key={`${index}-${url}`}
              src={url}
              alt={`${alt} (photo ${index + 2})`}
              className="aspect-[4/3] w-full rounded-xl bg-brand-100 object-cover shadow-sm"
              loading="lazy"
            />
          ))}
        </div>
      )}
    </div>
  )
}
