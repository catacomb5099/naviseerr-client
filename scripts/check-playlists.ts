/** Self-check for your own playlists' helpers; pulled in by check-download-state.ts. */
import { addedCopy, coverOf, mosaicOf, playlistMeta, titleClash } from '../src/lib/playlists'

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

// What an add says: counts, the one-song wording, and the nothing-new case.
assert(addedCopy({ added: 9, alreadyIn: 3 }, null, 'Road trip') === 'Added 9 songs to Road trip · 3 were already in it', 'some were in')
assert(addedCopy({ added: 1, alreadyIn: 0 }, 'Down', 'Road trip') === 'Added Down to Road trip', 'one song by name')
assert(addedCopy({ added: 0, alreadyIn: 1 }, 'Down', 'Road trip') === 'Down is already in Road trip', 'the song was there')
assert(addedCopy({ added: 0, alreadyIn: 4 }, null, 'Gym') === 'All 4 songs are already in Gym', 'the whole album was there')
assert(addedCopy({ added: 2, alreadyIn: 1 }, null, 'Gym') === 'Added 2 songs to Gym · 1 was already in it', 'one was in')

console.log('check-playlists: ok')
