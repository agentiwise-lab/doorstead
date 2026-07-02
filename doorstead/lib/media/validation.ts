export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024

export const MAX_IMAGES_PER_LISTING = 30

export type UploadRejectionReason = 'type' | 'size' | 'count'

export type UploadValidation =
  | { ok: true }
  | { ok: false; reason: UploadRejectionReason; message: string }

const ALLOWED_TYPES_LABEL = 'JPEG, PNG, or WebP'

export function validateUpload(
  file: { contentType: string; byteLength: number },
  currentCount: number,
): UploadValidation {
  if (
    !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.contentType)
  ) {
    return {
      ok: false,
      reason: 'type',
      message: `Only ${ALLOWED_TYPES_LABEL} images are allowed.`,
    }
  }

  if (file.byteLength > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      reason: 'size',
      message: 'Each image must be 10 MB or smaller.',
    }
  }

  if (currentCount >= MAX_IMAGES_PER_LISTING) {
    return {
      ok: false,
      reason: 'count',
      message: `A listing can have at most ${MAX_IMAGES_PER_LISTING} images.`,
    }
  }

  return { ok: true }
}
