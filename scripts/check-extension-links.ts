/** The extension's link reader: which YouTube Music links get a download button, and for what. */
import { targetFromHref } from '../extension/src/links'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check failed: ${message}`)
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

assert(same(targetFromHref('watch?v=ZVgHPSyEIqk'), { kind: 'SONG', id: 'ZVgHPSyEIqk' }), 'a song row links watch?v=')
assert(same(targetFromHref('watch?v=jNY_wLukVW0&list=OLAK5uy_nc6'), { kind: 'SONG', id: 'jNY_wLukVW0' }), 'a track in a list is still the song')
assert(same(targetFromHref('https://music.youtube.com/watch?v=abc'), { kind: 'SONG', id: 'abc' }), 'the player bar link is a full address')
assert(same(targetFromHref('browse/MPREb_yXhSI4FCUo6'), { kind: 'ALBUM', id: 'MPREb_yXhSI4FCUo6' }), 'an album link')
assert(same(targetFromHref('browse/VLRDCLAK5uy_nCz5'), { kind: 'PLAYLIST', id: 'RDCLAK5uy_nCz5' }), 'a playlist card drops the VL prefix')
assert(same(targetFromHref('playlist?list=PLUwsfagaCki8'), { kind: 'PLAYLIST', id: 'PLUwsfagaCki8' }), 'a playlist page address')
assert(targetFromHref('channel/UCr_iyUANcn9OX_yy9piYoLw') === null, 'artists get no button')
assert(targetFromHref('browse/MPSPPLxyz') === null && targetFromHref('browse/FEmusic_home') === null, 'podcasts and YouTube pages get no button')
assert(targetFromHref('watch?list=RDAMVM') === null && targetFromHref(null) === null, 'no id, no button')

console.log('check-extension-links: ok')
