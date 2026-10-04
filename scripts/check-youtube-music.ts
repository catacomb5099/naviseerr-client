/** Self-check for the "Play on YouTube Music" links; pulled in by check-download-state.ts. */
import { songLink } from '../src/lib/youtubeMusic'

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

console.log('check-youtube-music: ok')
