import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * What a failed API call says on the page. A 502 or 503 means something behind the server is down for
 * now (the YouTube Music helper, or the server itself behind the web app's proxy), so it says that in
 * plain words instead of "Bad Gateway". When the server said which in its own sentence (a 502 body with
 * `message`, since 19-10-2026: "YouTube Music is not answering right now…"), that sentence wins; an
 * older server sends no body and the URL-based guess stands. A 401 is "log in" (the gate shows the login
 * screen at the same time). Other statuses keep the status text.
 */
export function apiErrorMessage(url: string, status: number, statusText: string, body?: unknown): string {
  if (status === 401) return 'Log in to Naviseerr'
  if (status !== 502 && status !== 503) return `API request failed: ${statusText}`
  const said = (body as { message?: unknown } | null | undefined)?.message
  if (typeof said === 'string' && said) return said
  return url.includes('/search/')
    ? 'Search is not available right now. Try again in a minute.'
    : 'The server is not available right now. Try again in a minute.'
}

/** The server's own sentence from a failed load when something behind it is down (a 502 body with
 *  `message`, since 19-10-2026: YouTube Music not answering, or rate-limiting it), for a page to print
 *  under its own "Couldn't load…" line. Null for anything else, a bodiless 502 from an older server
 *  included, so the headline stands alone rather than blaming the Naviseerr server for a YouTube outage.
 *  Reads the error structurally (an ApiError has `status` and `body`): this file must not import the
 *  API client, which imports it. */
export function providerMessage(err: unknown): string | null {
  const e = err as { status?: unknown; body?: unknown } | null
  if (!e || typeof e !== 'object' || e.status !== 502) return null
  const said = (e.body as { message?: unknown } | null | undefined)?.message
  return typeof said === 'string' && said ? said : null
}

/** What a failed settings call says: the server's own sentence when it sent one ("Enter the Client ID.",
 *  "Could not reach auth.example.com: connection refused..."), else the error's ("Can't reach the Naviseerr
 *  server..."). Read structurally (an ApiError has `body`): this file must not import the API client. */
export function serverMessage(err: unknown): string {
  const body = (err as { body?: unknown } | null)?.body
  const message = body && typeof body === 'object' ? (body as { message?: unknown }).message : undefined
  if (typeof message === 'string' && message) return message
  return err instanceof Error ? err.message : 'Something went wrong. Try again.'
}

/** "3:05" - a track length. Floors the seconds too: the server can send fractional durations. */
export function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

// Spelled out rather than Intl: 'en' puts the month first and 'en-GB' abbreviates September as "Sept".
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "5 Oct" in the local calendar, with the year once it is not `now`'s ("21 Sep 2025"). */
export function shortDate(date: Date, now: Date = new Date()): string {
  const year = date.getFullYear() === now.getFullYear() ? '' : ` ${date.getFullYear()}`
  return `${date.getDate()} ${MONTHS[date.getMonth()]}${year}`
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
