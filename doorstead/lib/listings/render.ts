import type { RenderImage } from './contract'

// The card shows one image: the cover. getImagesForRender already leads its
// list with the cover (explicit cover first, else position order), so the card
// cover is simply the first image's thumb. Keeping the "cover = first" rule in
// one named place stops it drifting between the home grid and the gallery.
export function coverThumbUrl(images: RenderImage[]): string | null {
  return images[0]?.thumbUrl ?? null
}
