import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * What a failed API call says on the page. A 502 or 503 means something behind the server is down for
 * now (the YouTube Music helper, or the server itself behind the web app's proxy), so it says that in
 * plain words instead of "Bad Gateway". Other statuses keep the status text.
 */
export function apiErrorMessage(url: string, status: number, statusText: string): string {
  if (status !== 502 && status !== 503) return `API request failed: ${statusText}`
  return url.includes('/search/')
    ? 'Search is not available right now. Try again in a minute.'
    : 'The server is not available right now. Try again in a minute.'
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
