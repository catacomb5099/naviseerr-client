import { FormEvent, useState } from 'react'
import { putSlskdSettings } from '../../api/endpoints'
import { SlskdSettings } from '../../api/types'
import { OWN_SLSKD_FOLDER_HELP, canSaveSlskd } from '../../lib/soulseek'
import { serverMessage } from '../../lib/utils'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

/**
 * The form behind "Use my own slskd" on the Soulseek step: the address and API key of a Soulseek client
 * you already run, "Save and test" (the server asks that slskd who it is and, when it answers, talks to
 * it from then on; Sonarr's Test on a download client), and the one line of help that matters: naviseerr
 * must see that slskd's downloads folder, or nothing is filed. `settings` is what the server uses now.
 */
export function OwnSlskdCard({ settings, onSaved, onCancel }: {
  settings: SlskdSettings
  onSaved: (saved: SlskdSettings) => void
  onCancel: () => void
}) {
  // A key is stored for YOUR slskd only once one was saved here; the install's own key is not yours to keep.
  const keySet = !settings.fromInstallFile && settings.apiKeySet
  const [url, setUrl] = useState(settings.fromInstallFile ? '' : settings.url)
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      onSaved(await putSlskdSettings(url.trim(), apiKey))
    } catch (err) {
      setError(serverMessage(err))
      setSaving(false)
    }
  }

  const field = 'bg-zinc-900 border-zinc-700 text-white'
  return (
    <form onSubmit={save} className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4" aria-label="Your own slskd">
      <div>
        <label htmlFor="slskd-url" className="mb-1 block text-sm font-medium">slskd address</label>
        <Input id="slskd-url" value={url} onChange={e => setUrl(e.target.value)} autoComplete="off" spellCheck={false}
          placeholder="http://192.168.1.20:5030" aria-describedby="slskd-url-help" className={field} />
        <p id="slskd-url-help" className="mt-1 text-xs text-zinc-400">{OWN_SLSKD_FOLDER_HELP}</p>
      </div>
      <div>
        <label htmlFor="slskd-api-key" className="mb-1 block text-sm font-medium">API key</label>
        <Input id="slskd-api-key" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} autoComplete="off"
          placeholder={keySet ? 'unchanged' : ''} aria-describedby="slskd-api-key-help" className={field} />
        <p id="slskd-api-key-help" className="mt-1 text-xs text-zinc-400">
          From slskd's settings file (web → authentication → api_keys). Kept on the server and never shown again
          {keySet ? '; leave empty to keep the one already saved' : ''}.
        </p>
      </div>
      {error && <p role="alert" className="text-sm text-amber-400">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving || !canSaveSlskd(url, apiKey, keySet)} className="bg-green-600 text-white hover:bg-green-500">
          {saving ? 'Testing…' : 'Save and test'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="text-zinc-300 hover:bg-zinc-800 hover:text-white">
          Cancel
        </Button>
      </div>
    </form>
  )
}
