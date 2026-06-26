import { describe, expect, it } from 'vitest'
import { parsePhotoUrls, serializePhotoUrls } from '@/lib/listings/photo-urls'

describe('parsePhotoUrls', () => {
  it('returns [] for empty input', () => {
    expect(parsePhotoUrls('')).toEqual([])
  })

  it('trims whitespace from each line', () => {
    const out = parsePhotoUrls('  https://a.com/1.jpg  \n\thttps://b.com/2.jpg\t')
    expect(out).toEqual(['https://a.com/1.jpg', 'https://b.com/2.jpg'])
  })

  it('drops blank lines', () => {
    const out = parsePhotoUrls(
      'https://a.com/1.jpg\n\n   \nhttps://b.com/2.jpg\n',
    )
    expect(out).toEqual(['https://a.com/1.jpg', 'https://b.com/2.jpg'])
  })

  it('preserves order', () => {
    const out = parsePhotoUrls(
      'https://c.com/1.jpg\nhttps://a.com/2.jpg\nhttps://b.com/3.jpg',
    )
    expect(out).toEqual([
      'https://c.com/1.jpg',
      'https://a.com/2.jpg',
      'https://b.com/3.jpg',
    ])
  })

  it('preserves non-consecutive duplicates (NO dedupe)', () => {
    const out = parsePhotoUrls(
      'https://a.com/1.jpg\nhttps://b.com/2.jpg\nhttps://a.com/1.jpg',
    )
    expect(out).toEqual([
      'https://a.com/1.jpg',
      'https://b.com/2.jpg',
      'https://a.com/1.jpg',
    ])
  })
})

describe('serializePhotoUrls', () => {
  it('returns empty string for empty array', () => {
    expect(serializePhotoUrls([])).toBe('')
  })

  it('returns the URL with no trailing newline for a single entry', () => {
    expect(serializePhotoUrls(['https://a.com/1.jpg'])).toBe(
      'https://a.com/1.jpg',
    )
  })

  it('joins multiple URLs with newline and no trailing newline', () => {
    expect(
      serializePhotoUrls(['https://a.com/1.jpg', 'https://b.com/2.jpg']),
    ).toBe('https://a.com/1.jpg\nhttps://b.com/2.jpg')
  })

  it('round-trips through parsePhotoUrls', () => {
    const urls = [
      'https://a.com/1.jpg',
      'https://b.com/2.jpg',
      'https://c.com/3.jpg',
    ]
    expect(parsePhotoUrls(serializePhotoUrls(urls))).toEqual(urls)
  })
})
