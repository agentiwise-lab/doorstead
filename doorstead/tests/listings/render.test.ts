import { describe, expect, it } from 'vitest'
import { coverThumbUrl } from '@/lib/listings/render'
import type { RenderImage } from '@/lib/listings/contract'

function image(over: Partial<RenderImage>): RenderImage {
  return {
    url: 'https://signed.example/web',
    thumbUrl: 'https://signed.example/thumb',
    isFloorplan: false,
    ...over,
  }
}

describe('coverThumbUrl', () => {
  it('returns the first image thumb (the resolver already leads with the cover)', () => {
    const images = [
      image({ thumbUrl: 'https://signed.example/cover.thumb' }),
      image({ thumbUrl: 'https://signed.example/second.thumb' }),
    ]

    expect(coverThumbUrl(images)).toBe('https://signed.example/cover.thumb')
  })

  it('returns null when the listing has no images', () => {
    expect(coverThumbUrl([])).toBeNull()
  })
})
