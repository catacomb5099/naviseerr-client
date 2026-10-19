/**
 * The download quality setting's pure parts (no React): the five rows, Spotify's Audio quality words
 * with the bit rate under each, and the done screen's line. Checked by scripts/check-quality.ts.
 */
import type { DownloadQuality, DownloadQualitySettings } from '../api/types'

/** Spotify's five words, lowest first as on its screen. The bit rates are MP3's rungs, which is what
 *  Soulseek files come in (Spotify's own numbers are its streaming rates, not these). */
export const QUALITY_TIERS: { quality: DownloadQuality; label: string; bitrate: string }[] = [
  { quality: 'LOW', label: 'Low', bitrate: 'About 128 kbit/s' },
  { quality: 'NORMAL', label: 'Normal', bitrate: 'About 192 kbit/s' },
  { quality: 'HIGH', label: 'High', bitrate: 'About 256 kbit/s' },
  { quality: 'VERY_HIGH', label: 'Very high', bitrate: 'About 320 kbit/s' },
  { quality: 'LOSSLESS', label: 'Lossless', bitrate: 'FLAC and other lossless files' },
]

/** The done screen's line: the tier by its word, and whether it is the default nobody chose. A word
 *  this client does not know (a newer server) is shown as it came. */
export function qualitySummary(s: DownloadQualitySettings): string {
  const label = QUALITY_TIERS.find(t => t.quality === s.quality)?.label ?? s.quality
  return `Download quality: ${label}${s.default ? ' (the default)' : ''}.`
}
