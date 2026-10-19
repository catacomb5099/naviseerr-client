import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import { getDownloadQuality, putDownloadQuality } from '../../api/endpoints'
import { DownloadQuality, DownloadQualitySettings } from '../../api/types'
import { QUALITY_TIERS } from '../../lib/downloadQuality'
import { serverMessage } from '../../lib/utils'
import { Button } from '../ui/button'

/**
 * One step: the quality every download aims for, the shape of Spotify's Audio quality setting (a list
 * of five, one bit-rate line under each; the phone's radio list rather than the desktop's dropdown).
 * Pressing a row saves it at once, as the playlists switch does, and the row stays marked; nothing else
 * is said, the mark is the answer. While nobody has chosen, the default row says what it is. Stands
 * alone on the Settings page; `onDone` makes it a setup step (Next moves on).
 */
export function DownloadQualityStep({ onDone }: { onDone?: () => void }) {
  const [settings, setSettings] = useState<DownloadQualitySettings | null>(null)
  // An older server has no such setting (404): it takes lossless or 320 kbps files, as it always did.
  const [unsupported, setUnsupported] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    getDownloadQuality(controller.signal).then(setSettings, err => {
      if (controller.signal.aborted) return
      if (err instanceof ApiError && err.status === 404) setUnsupported(true)
      else setLoadError(err instanceof Error ? err.message : String(err))
    })
    return () => controller.abort()
  }, [])

  const choose = async (quality: DownloadQuality) => {
    if (!settings || quality === settings.quality) return
    const before = settings
    // Marked at once so a slow answer does not read as "nothing happened"; the server's answer replaces it.
    setSettings({ quality, default: false })
    setSaving(true)
    setError(null)
    try {
      setSettings(await putDownloadQuality(quality))
    } catch (err) {
      setSettings(before)
      setError(serverMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (unsupported) return <p className="text-zinc-400">This server is older than this setting: downloads take lossless or 320 kbps files, as before.</p>
  if (loadError) return <p role="alert" className="text-amber-400">{loadError}</p>
  if (!settings) return <p className="text-zinc-400">Looking up the download quality…</p>

  return (
    <div className="space-y-4">
      <fieldset disabled={saving} className="space-y-2">
        <legend className="sr-only">Download quality</legend>
        {QUALITY_TIERS.map(tier => {
          const checked = tier.quality === settings.quality
          return (
            <label
              key={tier.quality}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-green-500 ${checked ? 'border-green-600 bg-zinc-900' : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'}`}
            >
              <input
                type="radio"
                name="download-quality"
                value={tier.quality}
                checked={checked}
                onChange={() => choose(tier.quality)}
                className="mt-0.5 h-4 w-4 flex-none accent-green-600 focus-visible:outline-none"
              />
              <span>
                <span className="block text-sm font-medium">{tier.label}</span>
                <span className="block text-xs text-zinc-400">{tier.bitrate}</span>
                {checked && settings.default && <span className="block text-xs text-zinc-400">(what naviseerr did until now)</span>}
              </span>
            </label>
          )
        })}
      </fieldset>
      {error && <p role="alert" className="text-sm text-amber-400">{error}</p>}
      {onDone && <Button type="button" onClick={onDone} className="bg-green-600 text-white hover:bg-green-500">Next</Button>}
    </div>
  )
}
