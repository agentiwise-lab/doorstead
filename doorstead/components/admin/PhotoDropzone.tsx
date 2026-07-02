'use client'

import { useRef, useState } from 'react'

export type StagedPhoto = {
  id: string
  file: File
  previewUrl: string
}

export function stagePhoto(file: File): StagedPhoto {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
  }
}

// A staging dropzone: multi-select via the file picker AND drag-and-drop both
// attach files to `staged`. It holds nothing itself; the parent owns the staged
// list so it can either upload immediately (edit) or defer until the listing
// exists (create). Previews use object URLs, revoked when a photo is removed.
export function PhotoDropzone({
  staged,
  onChange,
  disabled = false,
}: {
  staged: StagedPhoto[]
  onChange: (next: StagedPhoto[]) => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const images = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (images.length === 0) return
    onChange([...staged, ...images.map(stagePhoto)])
  }

  const removeAt = (id: string) => {
    const target = staged.find((p) => p.id === id)
    if (target) URL.revokeObjectURL(target.previewUrl)
    onChange(staged.filter((p) => p.id !== id))
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (!disabled) addFiles(e.dataTransfer.files)
        }}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${
          disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
            : dragging
              ? 'cursor-pointer border-gray-900 bg-gray-50 text-gray-900'
              : 'cursor-pointer border-gray-300 text-gray-600 hover:border-gray-400'
        }`}
      >
        <p className="text-sm font-medium">
          Drag photos here, or click to choose
        </p>
        <p className="mt-1 text-xs text-gray-400">
          JPEG, PNG, or WebP. Select multiple at once.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={disabled}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {staged.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {staged.map((photo) => (
            <li
              key={photo.id}
              className="group relative overflow-hidden rounded border border-gray-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.previewUrl}
                alt={photo.file.name}
                className="aspect-[4/3] w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(photo.id)}
                className="absolute right-1 top-1 rounded bg-black/60 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
