/** Your playlist's picture: a centre square, stored as a JPEG at up to 1200 px (the album-art size the server's
 *  tagger already uses; Spotify asks for at least 300 px). Made in the browser, so the server only ever keeps and
 *  serves a JPEG and never decodes an image. */
export const COVER_SIZE = 1200
export const MIN_SIDE = 300
export const MAX_PICK_BYTES = 20 * 1024 * 1024
export const JPEG_QUALITY = 0.9
export const ACCEPT = 'image/jpeg,image/png,image/webp'

/** Why this file cannot be the picture, in words for the page; null when it can. `width`/`height` once read. */
export function coverProblem(file: { type: string; size: number }, width?: number, height?: number): string | null {
  if (!ACCEPT.split(',').includes(file.type)) return 'Pick a JPEG, PNG or WebP picture.'
  if (file.size > MAX_PICK_BYTES) return 'Pick a picture under 20 MB.'
  if (width !== undefined && height !== undefined && Math.min(width, height) < MIN_SIDE) {
    return `Pick a picture at least ${MIN_SIDE} × ${MIN_SIDE} pixels.`
  }
  return null
}

/** The centre square of a width × height picture, and the side it is drawn at (never enlarged). */
export function centreSquare(width: number, height: number): { sx: number; sy: number; side: number; out: number } {
  const side = Math.min(width, height)
  return { sx: Math.floor((width - side) / 2), sy: Math.floor((height - side) / 2), side, out: Math.min(side, COVER_SIZE) }
}

/** The picked file as the square JPEG to upload, or the sentence saying why not. Browser only. */
export async function makeCover(file: File): Promise<Blob | string> {
  const early = coverProblem(file)
  if (early) return early
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return 'That file could not be read as a picture.'
  }
  const late = coverProblem(file, bitmap.width, bitmap.height)
  if (late) { bitmap.close(); return late }
  const { sx, sy, side, out } = centreSquare(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = out
  canvas.getContext('2d')!.drawImage(bitmap, sx, sy, side, side, 0, 0, out, out)
  bitmap.close()
  const blob = await new Promise<Blob | null>(done => canvas.toBlob(done, 'image/jpeg', JPEG_QUALITY))
  return blob ?? 'That picture could not be prepared. Try another one.'
}
