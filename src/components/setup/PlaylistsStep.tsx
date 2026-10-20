import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import { getSuggestedPlaylistsSettings, putSuggestedPlaylistsSettings } from '../../api/endpoints'
import { SuggestedPlaylistsSettings } from '../../api/types'
import { cadenceCopy } from '../../lib/suggested'
import { serverMessage } from '../../lib/utils'
import { Button } from '../ui/button'

/**
 * One step: the weekly suggested playlists, as an opt-in. One switch, off for a new install, the shape
 * of Home Assistant's analytics question (off by default, one line of help, Next keeps your answer).
 * Flipping it saves at once and the server says in one sentence what that did ("On. … the first set
 * is being made now …"). Disabled, and says so, on an install with no playlist maker. Stands alone on
 * the Settings page; `onDone` makes it a setup step (Next moves on).
 */
export function PlaylistsStep({ onDone }: { onDone?: () => void }) {
  const [settings, setSettings] = useState<SuggestedPlaylistsSettings | null>(null)
  // An older server has no such setting (404): the weekly run follows its install file.
  const [unsupported, setUnsupported] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    getSuggestedPlaylistsSettings(controller.signal).then(setSettings, err => {
      if (controller.signal.aborted) return
      if (err instanceof ApiError && err.status === 404) setUnsupported(true)
      else setLoadError(err instanceof Error ? err.message : String(err))
    })
    return () => controller.abort()
  }, [])

  const toggle = async () => {
    if (!settings) return
    setSaving(true)
    setResult(null)
    try {
      const saved = await putSuggestedPlaylistsSettings(!settings.on)
      setSettings(saved)
      setResult({ ok: true, message: saved.message ?? (saved.on ? 'On.' : 'Off.') })
    } catch (err) {
      setResult({ ok: false, message: serverMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  if (unsupported) return <p className="text-zinc-400">This server is older than this setting: the weekly playlists follow its install file.</p>
  if (loadError) return <p role="alert" className="text-amber-400">{loadError}</p>
  if (!settings) return <p className="text-zinc-400">Looking up the weekly playlists…</p>

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <button
          type="button"
          role="switch"
          aria-checked={settings.on}
          aria-labelledby="playlists-switch-label"
          aria-describedby="playlists-switch-help"
          disabled={!settings.configured || saving}
          onClick={toggle}
          className={`relative mt-0.5 h-6 w-11 flex-none rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50 ${settings.on ? 'bg-green-600' : 'bg-zinc-700'}`}
        >
          <span aria-hidden="true" className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings.on ? 'translate-x-5' : ''}`} />
        </button>
        <div>
          <p id="playlists-switch-label" className="text-sm font-medium">Make weekly playlists for me</p>
          <p id="playlists-switch-help" className="mt-1 text-xs text-zinc-400">
            {settings.configured
              ? `${cadenceCopy(settings.refreshDay)} About 90 minutes the first time.`
              : 'This install has no playlist maker (no curator address or token).'}
          </p>
        </div>
      </div>
      {result && (
        <p role={result.ok ? 'status' : 'alert'} className={`text-sm ${result.ok ? 'text-green-400' : 'text-amber-400'}`}>{result.message}</p>
      )}
      {onDone && <Button type="button" onClick={onDone} className="bg-green-600 text-white hover:bg-green-500">Next</Button>}
    </div>
  )
}
