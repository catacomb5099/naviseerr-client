import { useCallback, useEffect, useState } from 'react'
import { getSetup } from '../api/endpoints'
import { SetupStatus } from '../api/types'

/**
 * Has this install been through its first-run setup? Asked once the login gate is passed (`ready`),
 * and again whenever that gate reopens and closes (a login turned on, another device's sign-in).
 * Null while unknown. A server that does not answer is asked again every five seconds, as the login
 * gate does; the amber bar says so meanwhile. `finished` is what the last screen's Finish calls, so
 * the app shows at once without asking the server again.
 */
export function useSetup(ready: boolean): { setup: SetupStatus | null; finished: () => void } {
  const [setup, setSetup] = useState<SetupStatus | null>(null)
  useEffect(() => {
    if (!ready) return
    const controller = new AbortController()
    let handle: number | undefined
    const ask = () => getSetup(controller.signal).then(setSetup, () => {
      if (!controller.signal.aborted) handle = window.setTimeout(ask, 5000)
    })
    void ask()
    return () => { controller.abort(); window.clearTimeout(handle) }
  }, [ready])
  const finished = useCallback(() => setSetup(s => ({ completed: true, libraryRoot: s?.libraryRoot ?? null })), [])
  return { setup, finished }
}
