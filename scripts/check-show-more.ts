/** Self-check for the search shelves' "Show more" helpers; pulled in by check-download-state.ts. */
import { MAX_RESULTS, PAGE, appendNew, isExhausted, looksAlike, nextLimit } from '../src/lib/showMore'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check failed: ${message}`)
}

const id = (s: string) => s

// A longer list keeps what is shown where it is and adds only the new ones, in the new list's order.
assert(appendNew(['a', 'b'], ['b', 'c', 'a', 'd'], id).join() === 'a,b,c,d', 'shown ones stay put, new ones follow')
// YouTube reorders between calls: an item that moved up is still not shown twice.
assert(appendNew(['a', 'b', 'c'], ['c', 'x', 'a', 'b'], id).join() === 'a,b,c,x', 'reordered answer merges by id')
// The same song twice in one answer (YouTube's pages overlap) is kept once.
assert(appendNew([], ['a', 'b', 'a', 'c', 'b'], id).join() === 'a,b,c', 'duplicates inside one answer collapse')
const same = ['a', 'b']
assert(appendNew(same, ['b', 'a'], id) === same, 'nothing new hands back the same list')

assert(nextLimit(PAGE, 25) === 2 * PAGE, 'a page more than last time')
assert(nextLimit(PAGE, 55) === 55, 'at least enough to show what the press asks for')
assert(nextLimit(90, 95) === MAX_RESULTS, 'never past the server ceiling')

assert(isExhausted(40, 33, 12), 'fewer than asked: YouTube has no more')
assert(isExhausted(40, 40, 0), 'a longer list with nothing new: stop offering')
assert(isExhausted(MAX_RESULTS, MAX_RESULTS, 20), 'the ceiling ends it')
assert(!isExhausted(40, 40, 18), 'a full answer with new ones: there may be more')

// The same song on the album and on a greatest-hits: two ids, one row.
const album = { id: 'v1', name: 'Champagne Supernova', artists: ['Oasis'] }
const hits = { id: 'v2', name: 'champagne supernova', artists: ['Oasis'] }
const cover = { id: 'v3', name: 'Champagne Supernova', artists: ['Some Band'] }
assert(appendNew([album], [hits, cover], looksAlike).map(s => s.id).join() === 'v1,v3', 'same title and artists collapse; a cover stays')

console.log('check-show-more: ok')
