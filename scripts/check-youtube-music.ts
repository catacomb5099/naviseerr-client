/** Self-check for the "Play on YouTube Music" links; pulled in by check-download-state.ts. */
import { collectionLink, songLink } from '../src/lib/youtubeMusic'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check failed: ${message}`)
}

assert(songLink('hpSrLjc5SMs', 'Wonderwall', ['Oasis']) === 'https://music.youtube.com/watch?v=hpSrLjc5SMs',
  'a videoId opens the player on that song')
assert(songLink('', 'Wonderwall', ['Oasis', 'Noel Gallagher']) === 'https://music.youtube.com/search?q=Wonderwall%20Oasis',
  'no id searches title and first artist')
assert(songLink('legacy-3f2a', 'Wonderwall', ['Oasis'])?.includes('/search?q=Wonderwall'),
  'a made-up legacy id is not a YouTube id')
assert(songLink(null, null, ['Oasis']) === 'https://music.youtube.com/search?q=Oasis', 'no title still searches the artist')
assert(songLink(null, ' ', []) === null, 'nothing to search for is no link')
assert(songLink('a&b', 'x', []) === 'https://music.youtube.com/watch?v=a%26b', 'the id is encoded')

const album = collectionLink('ALBUM', 'MPREb_1', 'OLAK5uy_1', 'v1')
assert(album.plays && album.href === 'https://music.youtube.com/watch?v=v1&list=OLAK5uy_1',
  'an album with its playlist id starts on the first track with the album queued')
assert(collectionLink('ALBUM', 'MPREb_1', null, 'v1').href === 'https://music.youtube.com/browse/MPREb_1',
  'an album without one (older server) opens its page')
assert(collectionLink('PLAYLIST', 'VLPL9', null, 'v9').href === 'https://music.youtube.com/watch?v=v9&list=PL9',
  'a playlist plays as itself, VL dropped, even from an older server')
const empty = collectionLink('PLAYLIST', 'PL9', 'PL9', undefined)
assert(!empty.plays && empty.href === 'https://music.youtube.com/playlist?list=PL9', 'no tracks opens the page')

console.log('check-youtube-music: ok')
