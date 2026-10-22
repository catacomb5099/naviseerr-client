/** Self-check for your own playlists' helpers; pulled in by check-download-state.ts. */
import { centreSquare, coverProblem } from '../src/lib/coverImage'
import { addedCopy, coverOf, dropIndex, mosaicOf, moveItem, playlistMeta, titleClash } from '../src/lib/playlists'

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

// Reordering: one move, and where a drag lands among rows 40 px apart (middles 20, 60, 100, 140).
assert(moveItem(['a', 'b', 'c', 'd'], 0, 2).join() === 'b,c,a,d', 'first to third')
assert(moveItem(['a', 'b', 'c', 'd'], 3, 0).join() === 'd,a,b,c', 'last to first')
assert(moveItem(['a', 'b'], 1, 5).join() === 'a,b', 'out of range changes nothing')
const mids = [20, 60, 100, 140]
assert(dropIndex(10, mids, 2) === 0, 'above everything is the top')
assert(dropIndex(70, mids, 0) === 1, 'dragging the first just past the second swaps them')
assert(dropIndex(50, mids, 0) === 0, 'not yet past the second stays first')
assert(dropIndex(500, mids, 1) === 3, 'below everything is the bottom')

// The picture rules: what can be picked, and the centre square drawn at no more than 1200 px.
assert(coverProblem({ type: 'image/heic', size: 1000 }) === 'Pick a JPEG, PNG or WebP picture.', 'not a picture we take')
assert(coverProblem({ type: 'image/png', size: 21 * 1024 * 1024 }) === 'Pick a picture under 20 MB.', 'too big to pick')
assert(coverProblem({ type: 'image/jpeg', size: 1000 }, 299, 800) !== null, 'too small on one side')
assert(coverProblem({ type: 'image/webp', size: 1000 }, 300, 300) === null, 'exactly the minimum is fine')
const wide = centreSquare(4000, 3000)
assert(wide.sx === 500 && wide.sy === 0 && wide.side === 3000 && wide.out === 1200, 'a wide photo: middle square, scaled down')
const small = centreSquare(500, 640)
assert(small.sx === 0 && small.sy === 70 && small.out === 500, 'a small tall picture is cut, not enlarged')

console.log('check-playlists: ok')
