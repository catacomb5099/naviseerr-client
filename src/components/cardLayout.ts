/**
 * How a result card is laid out.
 *
 * - 'carousel': fixed-width card in a horizontally scrolling row (mixed "All" results)
 * - 'grid': fluid card that fills its grid cell (standalone Albums / Artists views)
 */
export type CardLayout = 'carousel' | 'grid'

/** Horizontally scrolling row — one line of fixed-width cards, overflow scrolls. */
export const CAROUSEL_CONTAINER = 'flex gap-4 overflow-x-auto pb-4'

/**
 * Wrapping grid for standalone views. Column counts are tuned to keep a card at
 * roughly double the carousel size from tablet up:
 *   - tablet (768px):  2 cols -> ~348px vs 192px carousel
 *   - laptop (1024px): 3 cols -> ~309px
 *   - capped at max-w-7xl (1216px content): 3 cols -> ~389px
 *
 * The 3-col step is at `lg`, not `md`: 3 cols at 768px would give only ~224px,
 * barely larger than the carousel card it replaces.
 *
 * On phones a 2x card would be almost the full viewport, so small screens stay
 * 2-up — about the same size as the carousel there. Change `grid-cols-2` to
 * `grid-cols-1` for literal doubling on phones too.
 */
export const GRID_CONTAINER = 'grid grid-cols-2 lg:grid-cols-3 gap-6'

/** Many cards at carousel-like size ("Show all" pages of an artist's rows): 5-6 columns on desktop, as on
 *  YouTube Music's and Spotify's grid pages. GRID_CONTAINER's 2-3 large tiles suit a search pill, not 92 singles. */
export const DENSE_GRID_CONTAINER = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
