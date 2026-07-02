import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { generateVariants } from '@/lib/media/variants'

// A large, noisy source so downscaling genuinely reduces byte size. Noise
// defeats compression, so the original stays large and the resized variants
// are unambiguously smaller.
async function largeImage(format: 'png' | 'jpeg' | 'webp'): Promise<Uint8Array> {
  const width = 2000
  const height = 2000
  const channels = 3 as const
  const pixels = Buffer.alloc(width * height * channels)
  for (let i = 0; i < pixels.length; i += 1) {
    pixels[i] = Math.floor(Math.random() * 256)
  }
  const image = sharp(pixels, { raw: { width, height, channels } })
  const buf =
    format === 'png'
      ? await image.png().toBuffer()
      : format === 'jpeg'
        ? await image.jpeg().toBuffer()
        : await image.webp().toBuffer()
  return new Uint8Array(buf)
}

describe('generateVariants', () => {
  it('returns web and thumb payloads smaller than the original for a JPEG', async () => {
    const original = await largeImage('jpeg')

    const { web, thumb, webContentType, thumbContentType } =
      await generateVariants(original, 'image/jpeg')

    expect(web.byteLength).toBeLessThan(original.byteLength)
    expect(thumb.byteLength).toBeLessThan(web.byteLength)
    expect(webContentType).toBe('image/jpeg')
    expect(thumbContentType).toBe('image/jpeg')
    expect((await sharp(web).metadata()).format).toBe('jpeg')
    expect((await sharp(thumb).metadata()).format).toBe('jpeg')
  })

  it('keeps PNG in as PNG out', async () => {
    const original = await largeImage('png')

    const { web, thumb, webContentType, thumbContentType } =
      await generateVariants(original, 'image/png')

    expect(webContentType).toBe('image/png')
    expect(thumbContentType).toBe('image/png')
    expect((await sharp(web).metadata()).format).toBe('png')
    expect((await sharp(thumb).metadata()).format).toBe('png')
  })

  it('keeps WebP in as WebP out', async () => {
    const original = await largeImage('webp')

    const { web, thumb, webContentType, thumbContentType } =
      await generateVariants(original, 'image/webp')

    expect(webContentType).toBe('image/webp')
    expect(thumbContentType).toBe('image/webp')
    expect((await sharp(web).metadata()).format).toBe('webp')
    expect((await sharp(thumb).metadata()).format).toBe('webp')
  })

  it('makes the thumbnail smaller in dimensions than the web variant', async () => {
    const original = await largeImage('jpeg')

    const { web, thumb } = await generateVariants(original, 'image/jpeg')

    const webMeta = await sharp(web).metadata()
    const thumbMeta = await sharp(thumb).metadata()
    expect(thumbMeta.width).toBeLessThan(webMeta.width ?? 0)
  })
})
