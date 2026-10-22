import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import { getSearchLearningSettings, getSearchReports, putSearchLearningSettings } from '../../api/endpoints'
import { SearchLearningSettings } from '../../api/types'
import { serverMessage } from '../../lib/utils'

/**
 * "Help improve search": one switch, off on every install, the shape of Apple's "Share iPhone Analytics" (off until
 * you say yes, says exactly what is shared, with a way to see it). Flipping it saves at once. Disabled, and says so,
 * when the install sets no address to send to. "See what is sent" shows the newest reports as the server sends them.
 */
export function SearchLearningStep() {
  const [settings, setSettings] = useState<SearchLearningSettings | null>(null)
  const [unsupported, setUnsupported] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sample, setSample] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    getSearchLearningSettings(controller.signal).then(setSettings, err => {
      if (controller.signal.aborted) return
      if (err instanceof ApiError && err.status === 404) setUnsupported(true)
      else setLoadError(err instanceof Error ? err.message : String(err))
    })
    return () => controller.abort()
  }, [])

  const toggle = async () => {
    if (!settings) return
    setSaving(true)
    setError(null)
    try {
      setSettings(await putSearchLearningSettings(!settings.on))
    } catch (err) {
      setError(serverMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const showSample = (open: boolean) => {
    if (!open || sample !== null) return
    getSearchReports(3).then(
      data => setSample(data.reports.length
        ? JSON.stringify(data.reports, null, 2)
        : 'No song has been downloaded and filed yet, so there is nothing to show.'),
      err => setSample(serverMessage(err)))
  }

  if (unsupported) return <p className="text-zinc-400">This server is older than this setting: it sends nothing.</p>
  if (loadError) return <p role="alert" className="text-amber-400">{loadError}</p>
  if (!settings) return <p className="text-zinc-400">Looking up the setting…</p>

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <button
          type="button"
          role="switch"
          aria-checked={settings.on}
          aria-labelledby="search-learning-label"
          aria-describedby="search-learning-help"
          disabled={!settings.configured || saving}
          onClick={toggle}
          className={`relative mt-0.5 h-6 w-11 flex-none rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50 ${settings.on ? 'bg-green-600' : 'bg-zinc-700'}`}
        >
          <span aria-hidden="true" className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${settings.on ? 'translate-x-5' : ''}`} />
        </button>
        <div>
          <p id="search-learning-label" className="text-sm font-medium">Help improve search</p>
          <p id="search-learning-help" className="mt-1 text-xs text-zinc-400">
            {settings.configured
              ? `Sends to ${settings.sendsTo}, for each song downloaded after you switch this on: the song (title, artists, album, length and its YouTube Music id), the words searched and how many files each search found, the file picked (its name and last two folders, type, quality, size and length) and your download quality. Never Soulseek user names, your IP address or where your files are kept.`
              : 'This install has no address to send to (SEARCH_LEARNING_URL in the install file), so nothing is sent.'}
          </p>
        </div>
      </div>
      {settings.on && settings.since && (
        <p role="status" className="text-sm text-green-400">
          On since {new Date(settings.since).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}.
          {' '}{settings.sent} sent, {settings.waiting} waiting for the next send (every 10 minutes).
        </p>
      )}
      {settings.on && settings.problem && <p role="alert" className="text-sm text-amber-400">{settings.problem}</p>}
      {error && <p role="alert" className="text-sm text-amber-400">{error}</p>}
      <details onToggle={e => showSample(e.currentTarget.open)} className="text-sm">
        <summary className="cursor-pointer text-zinc-300 hover:text-white">See what is sent</summary>
        <p className="mt-2 text-xs text-zinc-400">Your three newest songs, exactly as they would be sent:</p>
        <pre className="mt-2 max-h-80 overflow-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-300">{sample ?? 'Loading…'}</pre>
      </details>
    </div>
  )
}
