import { describe, expect, it } from 'vitest'
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_LISTING,
  validateUpload,
} from '@/lib/media/validation'

describe('validateUpload', () => {
  it('accepts an allowed type within size and count limits', () => {
    const result = validateUpload(
      { contentType: 'image/jpeg', byteLength: 1024 },
      0,
    )
    expect(result.ok).toBe(true)
  })

  it('rejects a disallowed type and names the allowed types', () => {
    const result = validateUpload(
      { contentType: 'image/gif', byteLength: 1024 },
      0,
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('type')
    expect(result.message).toContain('JPEG')
    expect(result.message).toContain('PNG')
    expect(result.message).toContain('WebP')
  })

  it('accepts a file at exactly the 10 MB limit and rejects one byte over', () => {
    const atLimit = validateUpload(
      { contentType: 'image/png', byteLength: MAX_IMAGE_BYTES },
      0,
    )
    expect(atLimit.ok).toBe(true)

    const overLimit = validateUpload(
      { contentType: 'image/png', byteLength: MAX_IMAGE_BYTES + 1 },
      0,
    )
    expect(overLimit.ok).toBe(false)
    if (overLimit.ok) return
    expect(overLimit.reason).toBe('size')
    expect(overLimit.message).toContain('10 MB')
  })

  it('accepts the 30th image and rejects the 31st', () => {
    const thirtieth = validateUpload(
      { contentType: 'image/webp', byteLength: 1024 },
      MAX_IMAGES_PER_LISTING - 1,
    )
    expect(thirtieth.ok).toBe(true)

    const thirtyFirst = validateUpload(
      { contentType: 'image/webp', byteLength: 1024 },
      MAX_IMAGES_PER_LISTING,
    )
    expect(thirtyFirst.ok).toBe(false)
    if (thirtyFirst.ok) return
    expect(thirtyFirst.reason).toBe('count')
    expect(thirtyFirst.message).toContain('30')
  })
})
