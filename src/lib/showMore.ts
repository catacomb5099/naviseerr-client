/**
 * "Show more" on a search shelf. YouTube Music has no "next page" to ask for, so a shelf asks the
 * server again for a longer list and keeps the ones it has not shown yet. Pure, no React: the hook
 * in useShowMore.ts holds the state.
 */

/** What the server returns for a category unasked (its first page), and how much longer each ask gets. */
export const PAGE = 20
/** The server's ceiling for one category. */
export const MAX_RESULTS = 100

/**
 * `existing`, then whatever in `incoming` it does not hold yet, in incoming's order. Merged by id
 * rather than by position: YouTube hands the same song out twice across its pages, and a longer list
 * comes back in a slightly different order from the shorter one.
 */
export function appendNew<T>(existing: T[], incoming: T[], idOf: (item: T) => string): T[] {
  const seen = new Set(existing.map(idOf))
  const added = incoming.filter(item => {
    const id = idOf(item)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
  return added.length ? [...existing, ...added] : existing
}

/** How long a list to ask for next: a page more than last time, and at least enough to show `want`. */
export function nextLimit(lastAsked: number, want: number): number {
  return Math.min(MAX_RESULTS, Math.max(lastAsked + PAGE, want))
}

/**
 * Whether asking for more is pointless now: the server gave fewer than asked (YouTube has no more),
 * the longer list brought nothing new, or the ceiling is reached.
 */
export function isExhausted(asked: number, received: number, added: number): boolean {
  return received < asked || added === 0 || asked >= MAX_RESULTS
}

/**
 * What a song or album row looks like, for matching: title and artists, not id. YouTube carries the
 * same recording on the album, a single and a greatest-hits, each with its own id, and they would
 * read as the same row twice ("Champagne Supernova, Oasis" twice in one "oasis" search).
 */
export function looksAlike(item: { name: string; artists: string[] }): string {
  return `${item.name}\u0000${item.artists.join(', ')}`.toLowerCase()
}
