export function PhotoGallery({
  photoUrls,
  alt,
}: {
  photoUrls: string[]
  alt: string
}) {
  if (photoUrls.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-400">
        No photo
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {photoUrls.map((url, index) => (
        <img
          key={`${index}-${url}`}
          src={url}
          alt={`${alt} (photo ${index + 1})`}
          className="w-full rounded-lg bg-gray-100 object-cover"
          loading={index === 0 ? 'eager' : 'lazy'}
        />
      ))}
    </div>
  )
}
