import { authentikStartUrl } from '../api/endpoints'
import { AuthCard } from '../components/AuthCard'
import { Button } from '../components/ui/button'

/**
 * The login screen: the app's name and ONE button, as Immich's "Login with OAuth" and Grafana's single
 * "Sign in with ..." button. A plain link, not a fetch: the server answers it with a redirect to
 * Authentik, and Authentik sends the browser back to the address this screen was opened at, so logging
 * in at /downloads lands on the Downloads page. Spotify, YouTube Music and Navidrome all keep you
 * signed in afterwards; here that is the server's 30-day cookie.
 */
export function LoginPage() {
  return (
    <AuthCard title="Log in">
      <p className="mb-6 text-sm text-zinc-400">
        This naviseerr is protected by Authentik. Sign in there and you will be brought straight back.
      </p>
      <Button asChild className="w-full">
        <a href={authentikStartUrl(window.location.href)}>Continue with Authentik</a>
      </Button>
    </AuthCard>
  )
}
