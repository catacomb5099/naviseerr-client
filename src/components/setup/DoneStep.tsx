import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import { finishSetup, getLoginSettings, getSession, getSoulseekAccount } from '../../api/endpoints'
import { loginSummary, soulseekSummary } from '../../lib/setup'
import { serverMessage } from '../../lib/utils'
import { Button } from '../ui/button'

/**
 * The last screen, Jellyfin's "You're Done!" and Home Assistant's "All set!": one line per setting
 * as it now stands, where the music lands, then Finish. Each line comes from the setting's own GET,
 * so a skipped step reads as its default rather than as something the wizard remembered. Finish
 * tells the server the setup is done (it is not shown again, on any device) and opens the app.
 */
export function DoneStep({ libraryRoot, onDone }: { libraryRoot: string | null; onDone: () => void }) {
  const [lines, setLines] = useState<string[] | null>(null)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    // A 404 on the account is the install that keeps it in its install file; on the login, an older server.
    const soulseek = getSoulseekAccount(controller.signal).catch(err => {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    })
    const login = getLoginSettings(controller.signal).catch(() => null)
    Promise.all([soulseek, getSession(), login]).then(
      ([account, session, settings]) => setLines([soulseekSummary(account), loginSummary(session, settings)]),
      () => { if (!controller.signal.aborted) setLines([]) },
    )
    return () => controller.abort()
  }, [])

  const finish = async () => {
    setFinishing(true)
    setError(null)
    try {
      await finishSetup()
    } catch (err) {
      // An older server has nothing to remember; anything else is said, and Finish can be pressed again.
      if (!(err instanceof ApiError && err.status === 404)) {
        setError(serverMessage(err))
        setFinishing(false)
        return
      }
    }
    onDone()
  }

  return (
    <div className="space-y-4">
      {lines === null
        ? <p className="text-sm text-zinc-400">Looking up what was set…</p>
        : <ul className="space-y-1 text-sm text-zinc-200">{lines.map(line => <li key={line}>{line}</li>)}</ul>}
      {libraryRoot && (
        <p className="text-sm text-zinc-300">
          Songs and playlists land in <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-white">{libraryRoot}</code>;
          point your music app at that folder.
        </p>
      )}
      {error && <p role="alert" className="text-sm text-amber-400">{error}</p>}
      <Button type="button" onClick={finish} disabled={finishing} className="bg-green-600 text-white hover:bg-green-500">
        {finishing ? 'Finishing…' : 'Finish'}
      </Button>
    </div>
  )
}
