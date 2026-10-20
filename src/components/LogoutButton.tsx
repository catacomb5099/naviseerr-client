import { LogOut } from 'lucide-react'
import { logout } from '../api/endpoints'
import { useSession } from '../hooks/useSession'
import { reportLoggedOut } from '../lib/session'
import { Button } from './ui/button'

/**
 * "Log out", top right, where Spotify, YouTube Music and Navidrome keep it. A plain button rather than
 * an account menu: naviseerr shows no name (nothing in it is per-user). Nothing on an install without
 * a login. Ends this browser's naviseerr session only; Authentik's own session stays (as Grafana and
 * Immich do), so the next "Continue with Authentik" is one click.
 */
export function LogoutButton() {
  const { status, authRequired } = useSession()
  if (!authRequired || status !== 'in') return null

  const out = async () => {
    try { await logout() } finally { reportLoggedOut() }
  }

  return (
    <Button
      variant="outline"
      onClick={out}
      aria-label="Log out"
      className="h-10 flex-none bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Log out</span>
    </Button>
  )
}
