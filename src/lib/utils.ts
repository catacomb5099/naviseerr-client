import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "3:05" - a track length. Floors the seconds too: the server can send fractional durations. */
export function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

/** "1.2M", "998K" - how YouTube itself abbreviates a play count. */
const COMPACT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

/** "1.2M plays"; null when the count is unknown, so callers render nothing rather than "0 plays". */
export function formatPlays(count: number | null | undefined): string | null {
  return count == null ? null : `${COMPACT.format(count)} plays`
}

/** "19.3M views": how often one video or upload was watched, a smaller number than YouTube Music's
 *  combined plays, so it is never labelled as plays. Null when unknown, like formatPlays. */
export function formatViews(count: number | null | undefined): string | null {
  return count == null ? null : `${COMPACT.format(count)} views`
}
