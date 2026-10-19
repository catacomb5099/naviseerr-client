import { FocusEvent } from 'react'
import { logout } from '../api/endpoints'
import { useSession } from '../hooks/useSession'
import { reportLoggedOut } from '../lib/session'

/**
 * The round button with your initial, top right, whose menu has "Log out": where Spotify, YouTube Music
 * and Navidrome keep it. Nothing on a server without a login. A native details/summary, so it needs no
 * popover code; it closes when focus leaves it (a click elsewhere included).
 */
export function AccountMenu() {
  const { authRequired, username } = useSession()
  if (!authRequired || !username) return null

  const close = (e: FocusEvent<HTMLDetailsElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) e.currentTarget.removeAttribute('open')
  }
  const out = async () => {
    try { await logout() } finally { reportLoggedOut() }
  }

  return (
    <details className="relative flex-none" onBlur={close}>
      <summary
        aria-label={`Account: ${username}`}
        className="list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 text-black text-lg font-bold flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        {username[0].toUpperCase()}
      </summary>
      <div role="menu" className="absolute right-0 mt-2 w-48 rounded-md border border-zinc-800 bg-zinc-900 p-1 shadow-lg z-50">
        <p className="px-3 py-2 text-sm text-zinc-400 truncate" title={username}>{username}</p>
        <button
          role="menuitem"
          onClick={out}
          className="w-full text-left px-3 py-2 text-sm rounded hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          Log out
        </button>
      </div>
    </details>
  )
}
