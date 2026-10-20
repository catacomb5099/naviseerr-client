import { FormEvent, useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import { getSoulseekAccount, getStatus, putSoulseekAccount } from '../../api/endpoints'
import { SoulseekAccount } from '../../api/types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  IDLE_POLL_MS, LOGIN_POLL_MS, SOULSEEK_NAME_RULES, loginState, loginStatusCopy, soulseekNameProblem,
} from '../../lib/soulseek'

/**
 * One step: the Soulseek account this install logs in with. Shows the one setup made up (its name, and
 * the password behind Show, since it cannot be reset) or the one a person chose, says whether Soulseek
 * accepted it, and lets them switch to their own account. Wording follows Jellyfin's first-run wizard
 * and Navidrome's "Create Admin" step: one question per screen, plain words, the rules as helper text.
 * Stands alone on the Settings page today; `onDone` makes it a wizard step ("Keep it" moves on).
 */
export function SoulseekStep({ onDone }: { onDone?: () => void }) {
  const [account, setAccount] = useState<SoulseekAccount | null>(null)
  // The server's own sentence when the install keeps the account in its compose file (404).
  const [off, setOff] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // When the account was last changed here: for 30 s after that the line reads "Checking with Soulseek…".
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const controller = new AbortController()
    getSoulseekAccount(controller.signal).then(
      a => { setAccount(a); setLoggedIn(a.loggedIn) },
      err => {
        if (controller.signal.aborted) return
        if (err instanceof ApiError && err.status === 404) setOff(messageOf(err.body) ?? 'This install keeps its Soulseek account in its compose file.')
        else setLoadError(err instanceof Error ? err.message : String(err))
      },
    )
    return () => controller.abort()
  }, [])

  // Asks the server whether Soulseek accepted the login: every 2 s while "Checking…" after a save, every 10 s otherwise.
  const state = loginState(loggedIn, savedAt, now)
  const checking = state === 'checking'
  useEffect(() => {
    if (!account) return
    const controller = new AbortController()
    const tick = () => getStatus(controller.signal).then(
      s => { setLoggedIn(s.soulseek.loggedIn); setNow(Date.now()) },
      () => { if (!controller.signal.aborted) { setLoggedIn(null); setNow(Date.now()) } },
    )
    const timer = window.setInterval(tick, checking ? LOGIN_POLL_MS : IDLE_POLL_MS)
    return () => { controller.abort(); window.clearInterval(timer) }
  }, [account, checking])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    try {
      const saved = await putSoulseekAccount(name, password)
      setAccount(saved)
      setLoggedIn(false)
      setSavedAt(Date.now())
      setNow(Date.now())
      setEditing(false)
      setPassword('')
      setShowPassword(false)
    } catch (err) {
      setSaveError((err instanceof ApiError && messageOf(err.body)) || (err instanceof Error ? err.message : String(err)))
    } finally {
      setSaving(false)
    }
  }

  if (off) return <p className="text-zinc-400">{off}</p>
  if (loadError) return <p role="alert" className="text-amber-400">{loadError}</p>
  if (!account) return <p className="text-zinc-400">Looking up your Soulseek account…</p>

  const nameProblem = soulseekNameProblem(name)
  const statusColour = state === 'connected' ? 'text-green-400' : state === 'checking' ? 'text-zinc-300' : 'text-amber-400'

  return (
    <div className="space-y-4">
      {account.generated ? (
        <>
          <p>An account was made up for you: <strong className="font-semibold">{account.username}</strong>.</p>
          <p className="text-zinc-300">
            Write the password down, it cannot be reset:{' '}
            <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-sm text-white">
              {showPassword ? account.password : '••••••••••••'}
            </code>{' '}
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              aria-pressed={showPassword}
              className="rounded text-sm text-green-400 underline underline-offset-2 hover:text-green-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </p>
        </>
      ) : (
        <p>This install logs in to Soulseek as <strong className="font-semibold">{account.username}</strong>.</p>
      )}

      <p aria-live="polite" className={`text-sm ${statusColour}`}>{loginStatusCopy(state, account.username)}</p>
      {account.setInComposeFile && (
        <p className="text-sm text-amber-400">
          Your compose file sets this account, so a change made here lasts only until the next restart. To keep it,
          clear the two Soulseek values (<code className="font-mono">SOULSEEK_USERNAME</code> and{' '}
          <code className="font-mono">SOULSEEK_PASSWORD</code>) on the <code className="font-mono">setup</code> line.
        </p>
      )}

      {!editing ? (
        <div className="flex flex-wrap gap-3">
          {onDone && (
            <Button type="button" onClick={onDone} className="bg-green-600 text-white hover:bg-green-500">Keep it</Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => { setEditing(true); setSaveError(null) }}
            className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-white"
          >
            Use my own account
          </Button>
        </div>
      ) : (
        <form onSubmit={save} className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4" aria-label="Your own Soulseek account">
          <div>
            <label htmlFor="soulseek-username" className="mb-1 block text-sm font-medium">Soulseek username</label>
            <Input
              id="soulseek-username"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="username"
              aria-describedby="soulseek-username-help"
              aria-invalid={name !== '' && nameProblem !== null}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
            <p id="soulseek-username-help" className={`mt-1 text-xs ${name !== '' && nameProblem ? 'text-amber-400' : 'text-zinc-400'}`}>
              {name !== '' && nameProblem ? nameProblem : SOULSEEK_NAME_RULES}
            </p>
          </div>
          <div>
            <label htmlFor="soulseek-password" className="mb-1 block text-sm font-medium">Password</label>
            <Input
              id="soulseek-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              aria-describedby="soulseek-password-help"
              className="bg-zinc-900 border-zinc-700 text-white"
            />
            <p id="soulseek-password-help" className="mt-1 text-xs text-zinc-400">
              The account is created the first time Soulseek sees it; a name someone else already has will not log in.
              Passwords cannot be reset, so write it down.
            </p>
          </div>
          {saveError && <p role="alert" className="text-sm text-amber-400">{saveError}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={saving || nameProblem !== null || password === ''} className="bg-green-600 text-white hover:bg-green-500">
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)} className="text-zinc-300 hover:bg-zinc-800 hover:text-white">
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

/** The server's `{message}` body, when the error carried one. */
function messageOf(body: unknown): string | null {
  return typeof body === 'object' && body !== null && typeof (body as { message?: unknown }).message === 'string'
    ? (body as { message: string }).message
    : null
}
