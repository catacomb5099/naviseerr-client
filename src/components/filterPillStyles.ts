import { FilterType } from './FilterPills'

/**
 * The pill vocabulary and its class strings, shared by the Home pills and the Downloads pills so
 * the two rows cannot drift apart. Kept out of `FilterPills.tsx` because a component module that
 * also exports constants trips `react-refresh/only-export-components`, and lint treats warnings
 * as errors.
 */

/** Labels and order, identical on both pages. */
export const FILTER_PILL_OPTIONS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Songs', value: 'songs' },
  { label: 'Albums', value: 'albums' },
  { label: 'Artists', value: 'artists' },
]

/** The row: one horizontal line, scrolling rather than wrapping on narrow screens. */
export const PILL_ROW = 'flex gap-2 overflow-x-auto pb-2'

/** Shape shared by every text pill. */
export const PILL_BASE = 'cursor-pointer px-4 py-2 text-sm font-medium transition-colors'

/** Selected: a persistent filled green state, not a hover state. */
export const PILL_SELECTED = 'bg-green-600 hover:bg-green-500 text-white border-green-600'

export const PILL_UNSELECTED = 'bg-transparent hover:bg-zinc-800 text-zinc-400 border-zinc-700'

/** Padding for the icon-only clear pill. `p-2` around a 20px glyph lands on exactly the box
 *  `px-4 py-2 text-sm` produces (20px line box + 16px padding), so the clear pill is the same
 *  height as the pill it sits beside and reads as circular rather than as a squashed oval. */
export const PILL_ICON = 'cursor-pointer p-2 transition-colors'

/** Focus ring for the Downloads pills, which are real buttons. Deliberately not part of
 *  `PILL_BASE`: Home's pills are non-focusable divs, and adding focus utilities there would be
 *  dead CSS that only makes the shared string harder to read. */
export const PILL_FOCUS =
  'focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black'
