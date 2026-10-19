import { FormEvent, useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import { deleteMediaServer, getMediaServers, putMediaServers } from '../../api/endpoints'
import { MediaServerKind, MediaServersSettings } from '../../api/types'
import { MEDIA_SERVER_ENV, MEDIA_SERVER_NAME, canSaveMediaServer, mediaServerStatusCopy, secretSavedInApp } from '../../lib/mediaServers'
import { serverMessage } from '../../lib/utils'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

const KINDS: MediaServerKind[] = ['navidrome', 'jellyfin']
const FIELD = 'bg-zinc-900 border-zinc-700 text-white'
const PRIMARY = 'bg-green-600 text-white hover:bg-green-500'
const OUTLINE = 'border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-white'
const GHOST = 'text-zinc-300 hover:bg-zinc-800 hover:text-white'

/**
 * One step: which app plays your music, Navidrome or Jellyfin, so naviseerr can ask it to rescan the
 * moment a song or playlist lands. Pick one (Neither is the skip), type the address and the login,
 * "Save and test": the server asks that app for one rescan with the typed values and keeps them only
 * when it worked (Sonarr's Test on a download client), saying in plain words what to fix otherwise.
 * The saved state reads the server's last outcome, with Change and Remove; values from the install
 * file's lines say so. Stands alone on the Settings page; `onDone` makes it a setup step.
 */
export function MediaServerStep({ onDone }: { onDone?: () => void }) {
  const [settings, setSettings] = useState<MediaServersSettings | null>(null)
  // An older server has no such setting (404).
  const [unsupported, setUnsupported] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  // Which app's form is open; null shows the saved state or the choice.
  const [pick, setPick] = useState<MediaServerKind | null>(null)
  const [url, setUrl] = useState('')
  const [login, setLogin] = useState('')
  const [secret, setSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const load = (signal?: AbortSignal) => getMediaServers(signal).then(
    s => { setSettings(s); return s },
    err => {
      if (signal?.aborted) return null
      if (err instanceof ApiError && err.status === 404) setUnsupported(true)
      else setLoadError(err instanceof Error ? err.message : String(err))
      return null
    },
  )
  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [])

  const open = (kind: MediaServerKind) => {
    setPick(kind)
    setUrl(settings?.[kind]?.url ?? '')
    setLogin(kind === 'navidrome' ? settings?.navidrome?.username ?? '' : '')
    setSecret('')
    setResult(null)
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()
    if (!pick) return
    setSaving(true)
    setResult(null)
    try {
      const saved = await putMediaServers(pick === 'navidrome'
        ? { navidrome: { url: url.trim(), username: login.trim(), password: secret } }
        : { jellyfin: { url: url.trim(), apiKey: secret } })
      setSettings(saved)
      setPick(null)
      setResult({ ok: true, message: saved.message ?? 'Saved.' })
    } catch (err) {
      setResult({ ok: false, message: serverMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const remove = async (kind: MediaServerKind) => {
    setResult(null)
    try {
      await deleteMediaServer(kind)
      const fresh = await load()
      const name = MEDIA_SERVER_NAME[kind]
      setResult({ ok: true, message: fresh?.[kind] ? `Back to the install file's ${name}.` : `${name} is no longer asked to rescan.` })
    } catch (err) {
      setResult({ ok: false, message: serverMessage(err) })
    }
  }

  if (unsupported) return <p className="text-zinc-400">This server is older than this setting: update naviseerr to choose your music app here.</p>
  if (loadError) return <p role="alert" className="text-amber-400">{loadError}</p>
  if (!settings) return <p className="text-zinc-400">Looking up your music app…</p>

  const resultLine = result && (
    <p role={result.ok ? 'status' : 'alert'} className={`text-sm ${result.ok ? 'text-green-400' : 'text-amber-400'}`}>{result.message}</p>
  )

  if (pick) {
    const name = MEDIA_SERVER_NAME[pick]
    const secretSet = secretSavedInApp(settings, pick)
    return (
      <form onSubmit={save} className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4" aria-label={`Connect ${name}`}>
        <p className="text-sm font-medium text-zinc-200">{name}</p>
        <div>
          <label htmlFor="media-url" className="mb-1 block text-sm font-medium">Address</label>
          <Input id="media-url" value={url} onChange={e => setUrl(e.target.value)} autoComplete="off" spellCheck={false}
            placeholder={pick === 'navidrome' ? 'http://192.168.1.10:4533' : 'http://192.168.1.10:8096'}
            aria-describedby="media-url-help" className={FIELD} />
          <p id="media-url-help" className="mt-1 text-xs text-zinc-400">
            The address this server can reach: from inside Docker that is the machine's network address, not localhost.
          </p>
        </div>
        {pick === 'navidrome' && (
          <div>
            <label htmlFor="media-login" className="mb-1 block text-sm font-medium">Admin username</label>
            <Input id="media-login" value={login} onChange={e => setLogin(e.target.value)} autoComplete="off"
              aria-describedby="media-login-help" className={FIELD} />
            <p id="media-login-help" className="mt-1 text-xs text-zinc-400">Navidrome only lets an admin start a scan.</p>
          </div>
        )}
        <div>
          <label htmlFor="media-secret" className="mb-1 block text-sm font-medium">{pick === 'navidrome' ? 'Password' : 'API key'}</label>
          <Input id="media-secret" type="password" value={secret} onChange={e => setSecret(e.target.value)} autoComplete="off"
            placeholder={secretSet ? 'unchanged' : ''} aria-describedby="media-secret-help" className={FIELD} />
          <p id="media-secret-help" className="mt-1 text-xs text-zinc-400">
            {pick === 'jellyfin' ? 'Jellyfin: Dashboard → API Keys → +. ' : ''}
            Kept on the server and never shown again{secretSet ? '; leave empty to keep the one already saved for this address' : ''}.
          </p>
        </div>
        {resultLine}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || !canSaveMediaServer(pick, url, login, secret, secretSet)} className={PRIMARY}>
            {saving ? 'Testing…' : 'Save and test'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => { setPick(null); setResult(null) }} className={GHOST}>Cancel</Button>
        </div>
      </form>
    )
  }

  const saved = KINDS.filter(kind => settings[kind])
  if (saved.length) {
    return (
      <div className="space-y-4">
        {saved.map(kind => {
          const s = settings[kind]!
          const status = settings.status.find(st => st.name === MEDIA_SERVER_NAME[kind])
          const colour = !status ? 'text-zinc-300' : status.problem ? 'text-amber-400' : 'text-green-400'
          return (
            <div key={kind} className="space-y-2">
              <p aria-live="polite" className={`text-sm ${colour}`}>{mediaServerStatusCopy(kind, s.url, status)}</p>
              {s.fromInstallFile && (
                <p className="text-sm text-zinc-400">
                  Set in the install file ({MEDIA_SERVER_ENV[kind]}). Save here to use other values; remove those lines to
                  stop them being the fallback.
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => open(kind)} className={OUTLINE}>Change</Button>
                {!s.fromInstallFile && (
                  <Button type="button" variant="ghost" onClick={() => remove(kind)} className={GHOST}>Remove</Button>
                )}
              </div>
            </div>
          )
        })}
        {resultLine}
        {onDone && <Button type="button" onClick={onDone} className={PRIMARY}>Next</Button>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {KINDS.map(kind => (
          <Button key={kind} type="button" variant="outline" onClick={() => open(kind)} className={OUTLINE}>{MEDIA_SERVER_NAME[kind]}</Button>
        ))}
        {/* Neither is the skip: nothing saved, the music app finds new files on its own schedule. */}
        {onDone && <Button type="button" variant="ghost" onClick={onDone} className={GHOST}>Neither</Button>}
      </div>
      {resultLine}
    </div>
  )
}
