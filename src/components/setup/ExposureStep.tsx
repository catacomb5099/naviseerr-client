import { useState } from 'react'
import { useSession } from '../../hooks/useSession'
import { Button } from '../ui/button'
import { AuthentikStep } from './AuthentikStep'

/**
 * The setup's last question, Jellyfin's "Set up Remote Access" position (last, one choice): why an
 * app reachable from the internet needs a login in front, in plain words, then an explicit two-way
 * choice as Home Assistant's analytics question: "Continue with Authentik" opens the same Authentik
 * screen Settings → Login has, unchanged; "Not now, it stays open" moves on with no login. There is
 * no Skip link here on purpose: this is never passed silently. Back from Authentik, signed in, the
 * screen says the login is on and offers Next. Setup only: Settings shows AuthentikStep by itself.
 */
export function ExposureStep({ onDone }: { onDone: () => void }) {
  const session = useSession()
  const [connecting, setConnecting] = useState(false)

  if (session.authRequired) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-green-400">Authentik login is on: every visitor signs in through Authentik.</p>
        <Button type="button" onClick={onDone} className="bg-green-600 text-white hover:bg-green-500">Next</Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-200">
        Right now anyone who can reach naviseerr can use it. On your home network that is fine. Reachable from the
        internet, bots and strangers will find it: they can hammer search until YouTube Music blocks your server, start
        downloads until your disk is full, and read your whole library. Going on the internet? Put a login in front first.
      </p>
      {connecting ? (
        <AuthentikStep onDone={onDone} />
      ) : (
        <div className="space-y-4">
          <div>
            <Button type="button" onClick={() => setConnecting(true)} className="w-full bg-green-600 text-white hover:bg-green-500">
              Continue with Authentik
            </Button>
            <p className="mt-1 text-xs text-zinc-400">
              Authentik is a free login service you run yourself. Paste its address and the two keys it gives you; the install
              guide shows where.
            </p>
          </div>
          <div>
            <Button type="button" variant="outline" onClick={onDone}
              className="w-full border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-white">
              Not now, it stays open
            </Button>
            <p className="mt-1 text-xs text-zinc-400">No login. Fine on your own network. Add Authentik later in Settings → Login.</p>
          </div>
        </div>
      )}
    </div>
  )
}
