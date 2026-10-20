import { ArrowLeft } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { PageNavButton } from '../components/PageNavButton'
import { AuthentikStep } from '../components/setup/AuthentikStep'
import { MediaServerStep } from '../components/setup/MediaServerStep'
import { PlaylistsStep } from '../components/setup/PlaylistsStep'
import { SoulseekStep } from '../components/setup/SoulseekStep'

/**
 * Settings: one section per thing a person may change about their install, in the first-run setup's
 * order and built from its step components (without `onDone`, each section saves itself): Soulseek, the
 * music app, the weekly playlists and the login (19-10-2026). Reached from the gear on every page, the amber "Not connected to
 * Soulseek" strip's Fix link, and directly at /settings#<section>.
 */
export function SettingsPage({ onNavigateHome }: { onNavigateHome: () => void }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
      <AppHeader action={
        <PageNavButton label="Search" icon={<ArrowLeft className="w-4 h-4" />} onClick={onNavigateHome} />
      } />
      <h2 className="mb-6 text-2xl font-bold">Settings</h2>
      <section id="soulseek" aria-labelledby="soulseek-heading" className="max-w-2xl space-y-3">
        <h3 id="soulseek-heading" className="text-lg font-semibold">Soulseek</h3>
        <p className="text-sm text-zinc-400">
          The account this install's Soulseek client logs in with. Downloads come from the Soulseek network, so
          they wait while it is not logged in.
        </p>
        <SoulseekStep />
      </section>
      <section id="music-app" aria-labelledby="music-app-heading" className="mt-10 max-w-2xl space-y-3">
        <h3 id="music-app-heading" className="text-lg font-semibold">Music app</h3>
        <p className="text-sm text-zinc-400">
          Which app plays your music, Navidrome or Jellyfin. naviseerr asks it to rescan the moment a song or playlist lands,
          so new music shows up right away instead of at its next scheduled scan.
        </p>
        <MediaServerStep />
      </section>
      <section id="suggested-playlists" aria-labelledby="suggested-playlists-heading" className="mt-10 max-w-2xl space-y-3">
        <h3 id="suggested-playlists-heading" className="text-lg font-semibold">Suggested playlists</h3>
        <p className="text-sm text-zinc-400">
          The &ldquo;Made for you&rdquo; shelf on the Home page: 49 playlists built from what is popular right now (naviseerr
          asks Discogs and YouTube Music), a fresh set every week. Off unless you switch it on; the first set takes about 90
          minutes.
        </p>
        <PlaylistsStep />
      </section>
      <section id="login" aria-labelledby="login-heading" className="mt-10 max-w-2xl space-y-3">
        <h3 id="login-heading" className="text-lg font-semibold">Login</h3>
        <p className="text-sm text-zinc-400">
          Without a login, anyone who can reach this web app can search and download. Connect your Authentik with Save and
          test, and from that moment every visitor has to sign in through it. Leave it off if naviseerr only lives on your
          own network.
        </p>
        <AuthentikStep />
      </section>
    </div>
  )
}
