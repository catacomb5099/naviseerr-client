/**
 * Amber strip across the top of every page while the server's Soulseek client is not logged in. Warn
 * only: nothing is disabled, a download requested now simply waits in the queue until Soulseek is
 * back. `null` means "not known yet" (first poll pending, or a server too old to say) and shows
 * nothing. Same markup as the offline bar, so the two read as one family.
 */
export function SoulseekStatusBar({ connected }: { connected: boolean | null }) {
  if (connected !== false) return null
  return (
    <div role="status" className="sticky top-0 z-50 bg-amber-500 px-4 py-2 text-center text-sm font-medium text-black">
      Not connected to Soulseek — downloads will wait until it is
    </div>
  )
}
