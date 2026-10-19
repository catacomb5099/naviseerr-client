/** Pins the music-app step's rules and lines (src/lib/mediaServers.ts). Runs from check-download-state.ts. */
import { canSaveMediaServer, mediaServerStatusCopy, musicAppSummary } from '../src/lib/mediaServers'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check failed: ${message}`)
}

// Save and test needs an http(s) address, Navidrome's admin username, and a secret unless one is stored.
assert(canSaveMediaServer('navidrome', 'http://192.168.1.10:4533', 'admin', 'pw', false), 'all three: can save')
assert(canSaveMediaServer('navidrome', ' https://music.example ', 'admin', '', true), 'stored password kept, address trimmed')
assert(!canSaveMediaServer('navidrome', '192.168.1.10:4533', 'admin', 'pw', false), 'no scheme: cannot save')
assert(!canSaveMediaServer('navidrome', 'http://a b', 'admin', 'pw', false), 'a space in the address: cannot save')
assert(!canSaveMediaServer('navidrome', 'http://x', '', 'pw', false), 'Navidrome without a username: cannot save')
assert(!canSaveMediaServer('navidrome', 'http://x', 'admin', '', false), 'no password and none stored: cannot save')
assert(canSaveMediaServer('jellyfin', 'http://192.168.1.10:8096', '', 'key', false), 'Jellyfin needs no username')
assert(!canSaveMediaServer('jellyfin', 'http://x', '', '', false), 'no API key and none stored: cannot save')
assert(canSaveMediaServer('jellyfin', 'http://x', '', '', true), 'stored API key kept')

// The saved state reads the server's last outcome.
const url = 'http://192.168.1.10:4533'
assert(mediaServerStatusCopy('navidrome', url, undefined) === `Navidrome at ${url}: not checked yet.`, 'before the first check')
assert(mediaServerStatusCopy('navidrome', url, { name: 'Navidrome', url, problem: null, lastRescanAt: '2026-10-19T19:40:12Z' }) === `Navidrome at ${url}: connected.`, 'accepted')
assert(mediaServerStatusCopy('jellyfin', url, { name: 'Jellyfin', url, problem: 'Jellyfin refused the API key.', lastRescanAt: null }).endsWith('Jellyfin refused the API key.'), 'the problem sentence as is')

// The done screen's line.
const none = { navidrome: null, jellyfin: null, status: [] }
assert(musicAppSummary(none).startsWith('Music app: none'), 'nothing chosen')
assert(musicAppSummary({ ...none, navidrome: { url, username: 'admin', passwordSet: true, fromInstallFile: false } }) === `Music app: Navidrome at ${url}.`, 'one app')
assert(musicAppSummary({ ...none, jellyfin: { url: 'http://j:8096', apiKeySet: true, fromInstallFile: true } }).includes('(from the install file)'), 'env source named')

console.log('check-media-servers: ok')
