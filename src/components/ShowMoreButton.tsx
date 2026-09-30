import { ChevronRight } from 'lucide-react'

interface ShowMoreButtonProps {
  loading: boolean
  failed: boolean
  onClick: () => void
  /** What the shelf holds: "songs", "albums". */
  what: string
  /** Nothing on the shelf yet: the server could not load it at all. */
  empty: boolean
  /** 'below': a button under a list or grid. 'square' / 'round': a tile at the end of a scrolling row,
   *  the size and shape of the album or artist pictures beside it. */
  place: 'below' | 'square' | 'round'
}

/** "Show more" at the end of a search shelf, where the shelf runs out. */
export function ShowMoreButton({ loading, failed, onClick, what, empty, place }: ShowMoreButtonProps) {
  const label = loading ? 'Loading…'
    : failed ? (empty ? `Couldn't load ${what}. Try again` : "Couldn't load more. Try again")
    : 'Show more'
  // Never `disabled` while loading: a disabled button drops keyboard focus to the page, and the next
  // Tab would skip everything that just arrived. The hook ignores a press while it loads.
  const common = {
    type: 'button' as const,
    onClick,
    'aria-busy': loading,
    'aria-label': failed ? `Couldn't load ${empty ? '' : 'more '}${what}. Try again` : `Show more ${what}`,
  }
  const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'

  if (place === 'below') {
    return (
      <div className="mt-4 flex justify-center">
        <button {...common} className={`rounded-full border border-zinc-700 px-4 h-9 text-sm text-white hover:bg-zinc-800 ${loading ? 'opacity-60' : ''} ${focus}`}>
          {label}
        </button>
      </div>
    )
  }

  const size = place === 'square' ? 'w-40 md:w-48 h-40 md:h-48 rounded-lg' : 'w-32 md:w-40 h-32 md:h-40 rounded-full'
  return (
    <button
      {...common}
      className={`flex-shrink-0 self-start ${size} flex flex-col items-center justify-center gap-2 px-3 text-center text-sm text-zinc-300 border border-zinc-700 hover:bg-zinc-800 hover:text-white ${loading ? 'opacity-60' : ''} ${focus}`}
    >
      <ChevronRight className="w-6 h-6" aria-hidden="true" />
      {label}
    </button>
  )
}

/**
 * The shelf's count for screen readers, announced when it changes. It sits beside the list rather
 * than in the button, so it stays when the last press takes the button away.
 */
export function ShelfStatus({ loading, failed, count, what }: { loading: boolean; failed: boolean; count: number; what: string }) {
  return (
    <p className="sr-only" role="status">
      {loading ? '' : failed ? `Couldn't load more ${what}` : `${count} ${what} shown`}
    </p>
  )
}
