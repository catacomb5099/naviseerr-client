/**
 * Amber strip across the top of every page while the server's Soulseek client is not logged in. Warn
 * only: nothing is disabled, a download requested now simply waits in the queue until Soulseek is
 * back. Keyed on the login, not the connection: slskd is "connected" for a moment between opening the
 * socket and hearing whether the username was accepted, and only a login means downloads can run.
 * `null` means "not known yet" (first poll pending, or a server too old to say) and shows nothing.
 * When the connectivity work's offline bar lands it should reuse this markup, so the two read as one
 * family.
 */
export function SoulseekStatusBar({ loggedIn }: { loggedIn: boolean | null }) {
  if (loggedIn !== false) return null
  return (
    <div role="status" className="sticky top-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-black">
      Not connected to Soulseek — downloads will wait until it is
    </div>
  )
}
