import { ReactNode, useCallback, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CAROUSEL_CONTAINER } from './cardLayout'

/** A section's title with an optional "Show all" link and controls on its right (YouTube Music, Apple Music). */
export function SectionTitle({ title, showAllTo, children }: { title: string; showAllTo?: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <h3 className="text-xl font-semibold text-white truncate">{title}</h3>
      <div className="flex flex-shrink-0 items-center gap-3">
        {showAllTo && (
          <Link
            to={showAllTo}
            className="text-sm font-semibold text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
          >
            Show all
          </Link>
        )}
        {children}
      </div>
    </div>
  )
}

const ARROW = 'h-8 w-8 inline-flex items-center justify-center rounded-full border border-zinc-700 text-white hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'

/** A titled horizontally scrolling row of cards. Callers skip it when the list is empty. With a mouse or
 *  trackpad, a ‹ › pair beside the title pages the row (YouTube Music's desktop shelves): greyed at each
 *  end, absent when the row fits. Touch screens swipe instead, so they never see it. */
export function Shelf({ title, children }: { title: string; children: ReactNode }) {
  const row = useRef<HTMLDivElement>(null)
  const [edge, setEdge] = useState({ start: true, end: true })
  const measure = useCallback(() => {
    const el = row.current
    if (!el) return
    const start = el.scrollLeft <= 0
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
    setEdge(prev => (prev.start === start && prev.end === end ? prev : { start, end }))
  }, [])
  useLayoutEffect(() => {
    measure()
    // A window resize changes whether the row fits; the cards themselves have fixed widths.
    const observer = new ResizeObserver(measure)
    if (row.current) observer.observe(row.current)
    return () => observer.disconnect()
  }, [measure])
  const page = (direction: 1 | -1) => row.current?.scrollBy({
    left: direction * row.current.clientWidth * 0.9,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
  const fits = edge.start && edge.end

  return (
    <section>
      <SectionTitle title={title}>
        {!fits && (
          <div className="hidden [@media(hover:hover)_and_(pointer:fine)]:flex gap-2">
            <button type="button" aria-label={`Scroll ${title} left`} disabled={edge.start} onClick={() => page(-1)} className={ARROW}>
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button type="button" aria-label={`Scroll ${title} right`} disabled={edge.end} onClick={() => page(1)} className={ARROW}>
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </SectionTitle>
      <div ref={row} onScroll={measure} className={CAROUSEL_CONTAINER}>{children}</div>
    </section>
  )
}
