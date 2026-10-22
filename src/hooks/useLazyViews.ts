import { RefObject, useEffect, useReducer } from 'react'
import { getSongViews } from '../api/endpoints'

/** Ids per GET /songs/views. The server takes 50; half that fills the first rows sooner. */
const VIEWS_CHUNK = 25
/** How far below (and above) the screen a row is asked for, so its number is there when it scrolls in. */
const AHEAD = '800px 0px'
/** A scroll gathers the rows it reveals into one request. */
const GATHER_MS = 100

// Every count this tab got, by video id. A song with no number (adapter down, YouTube busy) is left out, so the next visit asks again.
// ponytail: per-tab map, no expiry or size cap; counts go a little stale within one session, add a TTL if anyone notices
const known = new Map<string, number>()

/** View counts for the rows inside `list` that carry `data-views-id`, asked only as each row comes near the
 *  screen (each video costs the server one YouTube call). Re-arms when `rows` changes. */
export function useLazyViews(list: RefObject<HTMLElement>, rows: unknown): Map<string, number> {
  const [, rerender] = useReducer((n: number) => n + 1, 0)

  useEffect(() => {
    const root = list.current
    if (!root) return
    let cancelled = false
    let busy = false
    let timer = 0
    const queue: string[] = []
    const asked = new Set<string>()

    // One request at a time, as before: the server is never handed a whole playlist at once.
    const flush = async () => {
      timer = 0
      busy = true
      while (queue.length > 0 && !cancelled) {
        const ids = queue.splice(0, VIEWS_CHUNK)
        try {
          const counts = await getSongViews(ids)
          for (const [id, n] of Object.entries(counts)) known.set(id, n)
        } catch {
          // Not remembered, so the next visit asks again; these rows just stay blank.
        }
        if (!cancelled) rerender()
      }
      busy = false
    }

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        observer.unobserve(entry.target)
        const id = (entry.target as HTMLElement).dataset.viewsId
        if (id && !known.has(id) && !asked.has(id)) { asked.add(id); queue.push(id) }
      }
      if (queue.length > 0 && !busy && !timer) timer = window.setTimeout(() => void flush(), GATHER_MS)
    }, { rootMargin: AHEAD })
    root.querySelectorAll('[data-views-id]').forEach(row => observer.observe(row))

    return () => { cancelled = true; observer.disconnect(); clearTimeout(timer) }
  }, [list, rows])

  return known
}
