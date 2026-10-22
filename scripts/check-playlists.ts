/** Self-check for your own playlists' helpers; pulled in by check-download-state.ts. */
import { coverOf, mosaicOf, playlistMeta, titleClash } from '../src/lib/playlists'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check failed: ${message}`)
}

// The mosaic takes different pictures in order and skips songs with none.
const m = mosaicOf(['a', 'a', null, 'b', '', 'c', 'd', 'e'])
assert(m.join() === 'a,b,c,d', 'four different pictures, in order')
assert(mosaicOf([null, undefined]).length === 0, 'no pictures, no mosaic')

// Your picture wins; four make a grid; one to three show the first alone; none is a plain square.
assert(coverOf('/playlists/p/cover?v=1', ['a', 'b', 'c', 'd']).kind === 'picture', 'the chosen picture wins')
const grid = coverOf(null, ['a', 'b', 'c', 'd'])
assert(grid.kind === 'grid' && grid.srcs.length === 4, 'four pictures make the grid')
const single = coverOf(null, ['a', 'b'])
assert(single.kind === 'single' && single.src === 'a', 'fewer than four show the first')
assert(coverOf(null, []).kind === 'empty', 'no pictures at all')

assert(playlistMeta({ trackCount: 12, downloadedAt: null }) === 'Draft · 12 songs', 'a draft says so')
assert(playlistMeta({ trackCount: 1, downloadedAt: '2026-10-20T10:00:00Z' }) === '1 song', 'created, one song')

const mine = [{ id: 'a', title: 'Road trip' }, { id: 'b', title: 'Gym' }]
assert(titleClash(' road TRIP ', 'b', mine), 'same name in another case clashes')
assert(!titleClash('Road trip', 'a', mine), 'a playlist does not clash with itself')
assert(!titleClash('  ', 'c', mine), 'a blank name clashes with nothing')

console.log('check-playlists: ok')
