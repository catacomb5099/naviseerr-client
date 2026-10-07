import { useEffect, useState } from 'react'
import { useConnectivity } from '../hooks/useConnectivity'

/**
 * One strip above every page: amber while the browser is offline or the server cannot be reached,
 * green for a moment once either comes back, nothing the rest of the time. The element is always
 * there (empty) so screen readers treat it as a live region and announce the text when it appears.
 */
export function ConnectivityBar() {
  const { browserOffline, serverDown, backOnlineUntil } = useConnectivity()
  // A wall clock in state, as DownloadCard's useNow: moved only when the green strip's end arrives,
  // so a new return (a later backOnlineUntil) shows at once and one timer hides it.
  const [now, setNow] = useState(() => Date.now())
  const backOnline = backOnlineUntil !== null && now < backOnlineUntil
  useEffect(() => {
    if (backOnlineUntil === null) return
    const handle = window.setTimeout(() => setNow(backOnlineUntil), Math.max(0, backOnlineUntil - Date.now()))
    return () => window.clearTimeout(handle)
  }, [backOnlineUntil])

  const message = browserOffline ? "You're offline. Changes will show when you're back."
    : serverDown ? "Can't reach the Naviseerr server. Retrying…"
      : backOnline ? 'Back online.' : null
  const tone = browserOffline || serverDown ? 'bg-amber-500 text-black' : 'bg-green-700 text-white'
  return (
    <div role="status" className={message ? `sticky top-0 z-40 py-1.5 text-center text-sm ${tone}` : ''}>
      {message}
    </div>
  )
}
