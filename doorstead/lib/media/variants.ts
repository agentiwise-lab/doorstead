import sharp, { type Sharp } from 'sharp'

// Same format in, same format out: the gallery hero and thumbnails must not
// silently re-encode a PNG (lossy) or drop a WebP's alpha. The web variant is
// bounded to a display-scale width; the thumbnail to a card/filmstrip width.
const WEB_MAX_WIDTH = 1600
const THUMB_MAX_WIDTH = 400

type Encoder = (image: Sharp) => Sharp

const encoderFor = (contentType: string): Encoder => {
  switch (contentType) {
    case 'image/png':
      return (image) => image.png()
    case 'image/webp':
      return (image) => image.webp()
    default:
      return (image) => image.jpeg()
  }
}

async function resizeTo(
  bytes: Uint8Array,
  maxWidth: number,
  encode: Encoder,
): Promise<Uint8Array> {
  const out = await encode(
    sharp(bytes).resize({ width: maxWidth, withoutEnlargement: true }),
  ).toBuffer()
  return new Uint8Array(out)
}

export async function generateVariants(
  bytes: Uint8Array,
  contentType: string,
): Promise<{
  web: Uint8Array
  thumb: Uint8Array
  webContentType: string
  thumbContentType: string
}> {
  const encode = encoderFor(contentType)
  const [web, thumb] = await Promise.all([
    resizeTo(bytes, WEB_MAX_WIDTH, encode),
    resizeTo(bytes, THUMB_MAX_WIDTH, encode),
  ])
  return {
    web,
    thumb,
    webContentType: contentType,
    thumbContentType: contentType,
  }
}
