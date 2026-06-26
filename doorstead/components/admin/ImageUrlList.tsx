'use client'

export function ImageUrlList({
  urls,
  onChange,
}: {
  urls: string[]
  onChange: (urls: string[]) => void
}) {
  function update(index: number, value: string) {
    const next = [...urls]
    next[index] = value
    onChange(next)
  }

  function remove(index: number) {
    const next = urls.filter((_, i) => i !== index)
    onChange(next)
  }

  function moveUp(index: number) {
    if (index === 0) return
    const next = [...urls]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    onChange(next)
  }

  function moveDown(index: number) {
    if (index === urls.length - 1) return
    const next = [...urls]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    onChange(next)
  }

  function addImage() {
    onChange([...urls, ''])
  }

  const inputClass =
    'min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500'
  const btnClass =
    'rounded border border-gray-300 px-2 py-2 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="space-y-2">
      {urls.map((url, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => update(index, e.target.value)}
            placeholder="https://example.com/photo.jpg"
            aria-label={`Photo URL ${index + 1}`}
            className={inputClass}
          />
          {index === 0 && (
            <span className="shrink-0 rounded bg-gray-900 px-2 py-0.5 text-xs font-medium text-white">
              Primary
            </span>
          )}
          <button
            type="button"
            onClick={() => moveUp(index)}
            disabled={index === 0}
            aria-label="Move up"
            className={btnClass}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => moveDown(index)}
            disabled={index === urls.length - 1}
            aria-label="Move down"
            className={btnClass}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => remove(index)}
            aria-label="Remove"
            className={`${btnClass} text-red-600 hover:bg-red-50`}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addImage}
        className="mt-1 rounded border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
      >
        + Add image
      </button>
    </div>
  )
}
