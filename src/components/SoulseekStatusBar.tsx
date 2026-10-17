/**
 * Amber strip across the top of every page while the server's Soulseek client is not logged in. Warn
 * only: nothing is disabled, a download requested now simply waits in the queue until Soulseek is
 * back. Keyed on the login, not the connection: slskd is "connected" for a moment between opening the
 * socket and hearing whether the username was accepted, and only a login means downloads can run.
 * `null` means "not known yet" (first poll pending, or a server too old to say) and shows nothing.
 * `username` names the account when the server knows it (the one setup made up, or the one in .env),
 * so a taken or mistyped name can be recognised from the strip itself; empty on an older server or
 * when slskd cannot be reached, and the strip then reads as before.
 * `libraryProblem` is the server's one sentence when finished songs cannot be filed into the music
 * library (the folder is missing or cannot be written to): a second strip in the same amber, since
 * the web app would otherwise say "Downloaded" while nothing reaches Navidrome or Jellyfin. Both
 * strips sit in one sticky box, so they stack instead of sliding over each other when scrolled.
 * When the connectivity work's offline bar lands it should reuse this markup, so the two read as one
 * family.
 */
export function SoulseekStatusBar({ loggedIn, username, libraryProblem }: {
  loggedIn: boolean | null
  username?: string | null
  libraryProblem?: string | null
}) {
  const notLoggedIn = loggedIn === false
  if (!notLoggedIn && !libraryProblem) return null
  const strip = 'bg-amber-500 px-4 py-2 text-center text-sm font-medium text-black'
  return (
    <div className="sticky top-0 z-50">
      {notLoggedIn && (
        <div role="status" className={strip}>
          Not connected to Soulseek{username ? ` as ${username}` : ''} — downloads will wait until it is
        </div>
      )}
      {libraryProblem && (
        <div role="status" className={`${strip} border-t border-amber-700`}>
          Downloads cannot be filed into your music library: {libraryProblem} Songs stay in Soulseek's download
          folder until this is fixed (see the README's Troubleshooting).
        </div>
      )}
    </div>
  )
}
