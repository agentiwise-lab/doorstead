export function parsePhotoUrls(raw: string): string[] {
  if (!raw) return []
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

export function serializePhotoUrls(urls: string[]): string {
  return urls.map((u) => u.replace(/\r?\n/g, '')).join('\n')
}
