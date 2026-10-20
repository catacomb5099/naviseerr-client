import { FormEvent, useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { ApiError } from '../../api/client'
import { authentikStartUrl, getLoginSettings, getSession, putLoginSettings, turnOffLogin } from '../../api/endpoints'
import { LoginSettings } from '../../api/types'
import { canSaveLogin, loginStatusCopy } from '../../lib/login'
import { applySession } from '../../lib/session'
import { serverMessage } from '../../lib/utils'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

/**
 * One step: connect Authentik. The three fields Immich's OAuth settings have (issuer, Client ID, Client
 * secret), the Redirect URL to paste into Authentik with a Copy button (Authentik's own UI copies its
 * URLs the same way), "Save and test" (the server reads Authentik's OpenID configuration before storing
 * anything, as Audiobookshelf's "Auto-populate" does), then "Continue with Authentik" to sign in once,
 * which is what turns the login on. Stands alone on the Settings page today; `onDone` makes it a wizard
 * step ("Skip for now" / "Done" move on).
 */
export function AuthentikStep({ onDone }: { onDone?: () => void }) {
  const [settings, setSettings] = useState<LoginSettings | null>(null)
  // The server's own sentence when it has no login at all (404: an older server).
  const [unsupported, setUnsupported] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [issuer, setIssuer] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const load = (signal?: AbortSignal) => getLoginSettings(signal).then(
    s => { setSettings(s); setIssuer(s.issuer ?? ''); setClientId(s.clientId ?? '') },
    err => {
      if (signal?.aborted) return
      if (err instanceof ApiError && err.status === 404) setUnsupported(true)
      else setLoadError(err instanceof Error ? err.message : String(err))
    },
  )
  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [])

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setResult(null)
    try {
      const saved = await putLoginSettings(issuer.trim(), clientId.trim(), clientSecret)
      setSettings(saved)
      setClientSecret('')
      setResult({ ok: true, message: saved.message ?? 'Authentik answered.' })
    } catch (err) {
      setResult({ ok: false, message: serverMessage(err) })
    } finally {
      setSaving(false)
    }
  }

  const turnOff = async () => {
    setResult(null)
    try {
      await turnOffLogin()
      await load()
      applySession(await getSession())   // the Log out button goes: there is nothing to log out of
      setResult({ ok: true, message: 'Authentik login is off. Everyone has been logged out; the settings are kept.' })
    } catch (err) {
      setResult({ ok: false, message: serverMessage(err) })
    }
  }

  const copy = async () => {
    if (!settings) return
    try {
      await navigator.clipboard.writeText(settings.redirectUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // No clipboard (plain HTTP on another machine): the field is selectable, copy by hand.
    }
  }

  if (unsupported) return <p className="text-zinc-400">This server is older than the login: update naviseerr to connect Authentik.</p>
  if (loadError) return <p role="alert" className="text-amber-400">{loadError}</p>
  if (!settings) return <p className="text-zinc-400">Looking up the login settings…</p>

  const connected = settings.clientSecretSet
  const statusColour = settings.enabled ? 'text-green-400' : connected ? 'text-zinc-300' : 'text-amber-400'
  const field = 'bg-zinc-900 border-zinc-700 text-white'

  return (
    <div className="space-y-4">
      <p aria-live="polite" className={`text-sm ${statusColour}`}>{loginStatusCopy(settings)}</p>

      <form onSubmit={save} className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4" aria-label="Connect Authentik">
        <div>
          <label htmlFor="login-issuer" className="mb-1 block text-sm font-medium">Authentik address</label>
          <Input id="login-issuer" value={issuer} onChange={e => setIssuer(e.target.value)} autoComplete="off"
            spellCheck={false} aria-describedby="login-issuer-help" className={field} />
          <p id="login-issuer-help" className="mt-1 text-xs text-zinc-400">
            The provider's &ldquo;OpenID Configuration Issuer&rdquo; in Authentik, for example
            https://auth.example.com/application/o/naviseerr/. Both your browser and this server must be able to reach it.
          </p>
        </div>
        <div>
          <label htmlFor="login-client-id" className="mb-1 block text-sm font-medium">Client ID</label>
          <Input id="login-client-id" value={clientId} onChange={e => setClientId(e.target.value)} autoComplete="off"
            spellCheck={false} className={field} />
        </div>
        <div>
          <label htmlFor="login-client-secret" className="mb-1 block text-sm font-medium">Client secret</label>
          <Input id="login-client-secret" type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)}
            autoComplete="off" placeholder={connected ? 'unchanged' : ''} aria-describedby="login-client-secret-help" className={field} />
          <p id="login-client-secret-help" className="mt-1 text-xs text-zinc-400">
            Kept on the server and never shown again{connected ? '; leave empty to keep the one already saved' : ''}.
          </p>
        </div>
        <div>
          <label htmlFor="login-redirect-url" className="mb-1 block text-sm font-medium">Redirect URL</label>
          <div className="flex gap-2">
            <Input id="login-redirect-url" readOnly value={settings.redirectUrl} onFocus={e => e.currentTarget.select()}
              aria-describedby="login-redirect-url-help" className={`${field} font-mono text-sm`} />
            <Button type="button" variant="outline" onClick={copy} aria-label="Copy the redirect URL"
              className="flex-none border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-white">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>
          <p id="login-redirect-url-help" className="mt-1 text-xs text-zinc-400">
            Paste this into the provider's &ldquo;Redirect URIs&rdquo; in Authentik. It is the address you are using right
            now; connect from the address you will use later (your domain, behind HTTPS).
          </p>
        </div>
        {result && (
          <p role={result.ok ? 'status' : 'alert'} className={`text-sm ${result.ok ? 'text-green-400' : 'text-amber-400'}`}>{result.message}</p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || !canSaveLogin(issuer, clientId, clientSecret, connected)}
            className="bg-green-600 text-white hover:bg-green-500">
            {saving ? 'Testing…' : 'Save and test'}
          </Button>
          {connected && !settings.enabled && (
            <Button asChild className="bg-white text-black hover:bg-zinc-200">
              <a href={authentikStartUrl(window.location.href)}>Continue with Authentik</a>
            </Button>
          )}
          {settings.enabled && (
            <Button type="button" variant="outline" onClick={turnOff}
              className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-white">
              Turn off Authentik login
            </Button>
          )}
          {onDone && (
            <Button type="button" variant="ghost" onClick={onDone} className="text-zinc-300 hover:bg-zinc-800 hover:text-white">
              {settings.enabled ? 'Done' : 'Skip for now'}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
