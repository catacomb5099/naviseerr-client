import { ArrowLeft } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { PageNavButton } from '../components/PageNavButton'
import { AuthentikStep } from '../components/setup/AuthentikStep'
import { SoulseekStep } from '../components/setup/SoulseekStep'

/**
 * Settings: one section per thing a person may change about their install, each a step component
 * the first-run wizard will reuse: Soulseek and the login today (19-10-2026). Reached from the gear on
 * every page, the amber "Not connected to Soulseek" strip's Fix link, and directly at /settings.
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
      <section id="login" aria-labelledby="login-heading" className="mt-10 max-w-2xl space-y-3">
        <h3 id="login-heading" className="text-lg font-semibold">Login</h3>
        <p className="text-sm text-zinc-400">
          Without a login, anyone who can reach this web app can search and download. Connect your Authentik and sign in
          once, and from then on every visitor has to sign in through it. Leave it off if naviseerr only lives on your
          own network.
        </p>
        <AuthentikStep />
      </section>
    </div>
  )
}
