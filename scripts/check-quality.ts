/** Pins the download quality setting's pure parts (src/lib/downloadQuality.ts). Runs from check-download-state.ts. */
import { QUALITY_TIERS, qualitySummary } from '../src/lib/downloadQuality'
import { DownloadQuality } from '../src/api/types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`check failed: ${message}`)
}

// Spotify's five words, lowest first, each with a line under it; the two the picker cares most about by number.
assert(QUALITY_TIERS.map(t => t.label).join(',') === 'Low,Normal,High,Very high,Lossless', 'the five rows in Spotify\'s order')
assert(QUALITY_TIERS.map(t => t.quality).join(',') === 'LOW,NORMAL,HIGH,VERY_HIGH,LOSSLESS', 'each row carries the server\'s word')
assert(QUALITY_TIERS.every(t => t.bitrate.length > 0), 'every row has a line under it')
assert(QUALITY_TIERS.find(t => t.quality === 'VERY_HIGH')?.bitrate === 'About 320 kbit/s', 'Very high is the 320 kbps rung')
assert(QUALITY_TIERS.find(t => t.quality === 'LOSSLESS')?.bitrate.startsWith('FLAC'), 'Lossless names FLAC, not a number')

// The done screen says where the setting stands, from the setting itself: the default says so.
assert(qualitySummary({ quality: 'LOSSLESS', default: true }) === 'Download quality: Lossless (the default).', 'nothing chosen: the default, named')
assert(qualitySummary({ quality: 'HIGH', default: false }) === 'Download quality: High.', 'a chosen tier by its word')
assert(qualitySummary({ quality: 'HI_RES' as DownloadQuality, default: false }) === 'Download quality: HI_RES.', 'a newer server\'s word is shown as it came')

console.log('check-quality: ok')
