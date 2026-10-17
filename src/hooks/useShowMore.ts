import { RefObject, useEffect, useRef, useState } from 'react'
import { PAGE, appendNew, isExhausted, nextLimit } from '../lib/showMore'

export interface ShowMore<T> {
  /** What the shelf shows now. */
  shown: T[]
  /** Whether "Show more" can bring anything: some are kept back, or the server may have more. */
  hasMore: boolean
  loading: boolean
  /** The last ask for more failed (or, on All, the server could not load this shelf at all);
   *  pressing the button again retries it. */
  failed: boolean
  showMore: () => void
  /** The last press, for moving keyboard focus: where its new items start, and what had focus when
   *  the button was pressed (the button itself, or the page in Safari). Null before a press. */
  press: { from: number; focus: Element | null } | null
}

interface Shelf<T> {
  items: T[]
  shownCount: number
  /** The limit the server was last asked for. */
  asked: number
  exhausted: boolean
}

/**
 * Shelves the user has expanded, by search and then shelf name, so Back from an album lands on the
 * list as long as it was: leaving the search page unmounts it. Only expanded shelves are kept (an
 * unexpanded one is just the server's first page, which the request cache already has) and only
 * for a while, so a newer answer from the server is not overridden for the rest of the session.
 */
const kept = new Map<string, Map<string, { shelf: Shelf<unknown>; at: number }>>()
const KEPT_SEARCHES = 20
const KEPT_MS = 30 * 60 * 1000
/** Bumped by a retry, so a "Show more" still loading from before it cannot write the old list back. */
const generation = new Map<string, number>()

/** A retry ("search again" on the same words) starts that search's shelves from their first page. */
export function forgetShelves(search: string) {
  kept.delete(search)
  generation.set(search, (generation.get(search) ?? 0) + 1)
}

/**
 * One search shelf. It starts with `first` showing `firstShown` of them, shows `step` more per
 * press, and asks the server for a longer list once it runs out of kept ones.
 *
 * Fewer than a page on the first answer means there is no more, unless `failedOnServer`: All's
 * answer names the parts that failed, and such a shelf may be short or empty only because of that.
 */
export function useShowMore<T>(
  search: string,
  name: string,
  first: T[],
  idOf: (item: T) => string,
  fetchLonger: (limit: number) => Promise<T[]>,
  firstShown: number,
  step: number,
  failedOnServer: boolean,
): ShowMore<T> {
  const [start] = useState(() => {
    const saved = kept.get(search)?.get(name)
    if (saved && Date.now() - saved.at < KEPT_MS) return { shelf: saved.shelf as Shelf<T>, restored: true }
    const items = appendNew([], first, idOf)
    return {
      shelf: {
        items,
        // Never more than there is: the first press then asks for the next page and focus lands on
        // its first item, even when the server sent nothing or duplicates were folded away.
        shownCount: Math.min(firstShown, items.length),
        asked: failedOnServer ? 0 : PAGE,
        exhausted: !failedOnServer && first.length < PAGE,
      },
      restored: false,
    }
  })
  const [shelf, setShelf] = useState<Shelf<T>>(start.shelf)
  const [loading, setLoading] = useState(false)
  // A shelf restored from memory was loaded fine since, whatever the cached answer still says.
  const [failed, setFailed] = useState(failedOnServer && !start.restored)
  const [press, setPress] = useState<ShowMore<T>['press']>(null)
  const [mountedIn] = useState(() => generation.get(search) ?? 0)

  const update = (next: Shelf<T>) => {
    setShelf(next)
    if ((generation.get(search) ?? 0) !== mountedIn) return
    let shelves = kept.get(search)
    if (!shelves) {
      shelves = new Map()
      kept.set(search, shelves)
      if (kept.size > KEPT_SEARCHES) kept.delete(kept.keys().next().value as string)
    }
    shelves.set(name, { shelf: next, at: Date.now() })
  }

  const showMore = () => {
    if (loading) return
    const { items, shownCount, asked, exhausted } = shelf
    const want = shownCount + step
    setPress({ from: shownCount, focus: document.activeElement })
    if (want <= items.length || exhausted) {
      update({ ...shelf, shownCount: Math.min(want, items.length) })
      return
    }
    // What is kept back shows at once; the longer list fills in the rest, and a failed ask never
    // hides what was already loaded.
    if (shownCount < items.length) update({ ...shelf, shownCount: items.length })
    const limit = nextLimit(asked, want)
    setLoading(true)
    setFailed(false)
    fetchLonger(limit)
      .then(incoming => {
        const merged = appendNew(items, incoming, idOf)
        update({
          items: merged,
          shownCount: Math.min(want, merged.length),
          asked: limit,
          exhausted: isExhausted(limit, incoming.length, merged.length - items.length),
        })
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }

  return {
    shown: shelf.items.slice(0, shelf.shownCount),
    hasMore: shelf.shownCount < shelf.items.length || !shelf.exhausted,
    loading,
    failed,
    showMore,
    press,
  }
}

/**
 * After a press, keyboard focus goes to the first item it added (the list's `focusFrom`-th child,
 * or the first link or button inside it), so the next Tab carries on through what just arrived. If
 * the press added nothing and the button went away with it, focus goes to the last item instead of
 * falling to the page. Only if focus is still where the press left it: someone who moved on to the
 * search box while it loaded keeps their place.
 */
export function useFocusFirstNew(list: RefObject<HTMLElement>, shelf: ShowMore<unknown>) {
  const done = useRef<ShowMore<unknown>['press']>(null)
  const { press, loading, hasMore } = shelf
  const count = shelf.shown.length
  useEffect(() => {
    if (press === null || done.current === press) return
    const index = count > press.from ? press.from : !loading && !hasMore ? count - 1 : -1
    if (index < 0) return
    done.current = press
    const active = document.activeElement
    if (active !== press.focus && active !== document.body && active !== null) return
    const row = list.current?.children[index]
    const target = row?.matches('a, button') ? row : row?.querySelector('a, button')
    if (target instanceof HTMLElement) target.focus({ preventScroll: true })
  }, [list, press, count, loading, hasMore])
}
