/** Words and looks for the suggested playlists: pure functions, checked by scripts/check-suggested.ts. */
import { CuratorRun } from '../api/types'

/** Plain words for the curator's tiers. An unknown tier (a future curator) shows its raw word. */
export function tierCopy(tier: string): string {
  switch (tier) {
    case 'top': return 'Top hit'
    case 'mid': return 'Deep cut'
    case 'random': return 'Wild card'
    default: return tier
  }
}

/** The curator's YYYY-MM-DD as a local calendar day, or null when it is not one. Local, not UTC: the
 *  curator writes a date, not a moment, and "today" must mean the user's today. */
function parseEditionDate(editionDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(editionDate)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

const WEEKDAY = new Intl.DateTimeFormat('en', { weekday: 'long' })
// Fixed English for the long form: the app's copy is English, and 'en-GB' puts the day first.
const LONG_DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
// Spelled out rather than Intl: 'en' puts the month first and 'en-GB' abbreviates September as "Sept".
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * How fresh an edition is, the way the streaming services say it: "Updated today", "Updated yesterday",
 * "Updated Monday" within the last week, then "Updated 21 Sep" (with the year once it is another year).
 * A date the code cannot read is shown as it came, never hidden.
 */
export function editionLabel(editionDate: string, now: Date = new Date()): string {
  const edition = parseEditionDate(editionDate)
  if (!edition) return `Edition ${editionDate}`
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((today.getTime() - edition.getTime()) / 86_400_000)
  if (days <= 0) return 'Updated today'
  if (days === 1) return 'Updated yesterday'
  if (days < 7) return `Updated ${WEEKDAY.format(edition)}`
  const year = edition.getFullYear() === today.getFullYear() ? '' : ` ${edition.getFullYear()}`
  return `Updated ${edition.getDate()} ${MONTHS[edition.getMonth()]}${year}`
}

/** "27 September 2026" for the playlist page's header; the raw text when it cannot be read. */
export function editionDateLong(editionDate: string): string {
  const edition = parseEditionDate(editionDate)
  return edition ? LONG_DATE.format(edition) : editionDate
}

/** "1980-1989 · Indie Pop": the Discogs filters behind a category, year first, then the rest as sent. */
export function filtersCopy(filters: Record<string, string>): string {
  const rest = Object.entries(filters).filter(([k, v]) => k !== 'year' && v).map(([, v]) => v)
  return [filters.year, ...rest].filter(Boolean).join(' · ')
}

/** A deterministic colour pair per category, so a playlist keeps its cover from week to week and two
 *  categories never share one. Same idea as the streaming services' templated covers: no artwork is
 *  stored for a playlist, the title on a coloured field IS the cover. */
export function coverGradient(category: string): string {
  let hash = 0
  for (const ch of category) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const hue = hash % 360
  const hue2 = (hue + 48) % 360
  return `linear-gradient(135deg, hsl(${hue} 70% 46%) 0%, hsl(${hue2} 75% 24%) 100%)`
}

/** "New edition every Monday." from the server's "MONDAY"; "A new edition every week." when it cannot say. */
export function cadenceCopy(refreshDay: string | null): string {
  if (!refreshDay) return 'A new edition every week.'
  const day = refreshDay.charAt(0).toUpperCase() + refreshDay.slice(1).toLowerCase()
  return `New edition every ${day}.`
}

/** Plain words for a category's status inside a curator run; an unknown status shows its raw word. */
export function categoryStatusCopy(status: string): string {
  switch (status) {
    case 'queued': return 'waiting'
    case 'running': return 'in progress'
    case 'written': return 'ready'
    case 'exists': return 'already made this week'
    case 'no_albums': return 'nothing found on Discogs'
    case 'thin_pool': return 'not enough songs'
    case 'error': return 'failed'
    default: return status
  }
}

/** True for a category the run has finished with, whatever the outcome. */
export function categoryDone(status: string): boolean {
  return status !== 'queued' && status !== 'running'
}

/** "80s indie pop" from the run's category key, which is all the run record carries. */
export function categoryName(key: string): string {
  return key.replace(/-/g, ' ')
}

/**
 * One sentence for where a run is: progress while it works, the outcome once it is over. "Ready"
 * counts a playlist written this run and one that already existed - either way the user has it.
 */
export function runSummary(run: CuratorRun): string {
  const total = run.categories.length
  if (!run.final) {
    const done = run.categories.filter(c => categoryDone(c.status)).length
    return `Making this week's playlists… ${done} of ${total} done. This usually takes a few minutes.`
  }
  const ready = run.categories.filter(c => c.status === 'written' || c.status === 'exists').length
  if (total > 0 && ready === total) return "This week's playlists are ready."
  if (ready > 0) return `${ready} of ${total} playlists are ready.`
  return "Couldn't make this week's playlists."
}
