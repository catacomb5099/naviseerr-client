import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/**
 * The frame every first-run screen sits in, the shape of Jellyfin's setup wizard: the product name,
 * "1 of 4", one question, one line of help, then the step's own body with its one primary button, and
 * under it the "Not sure? Skip for now" link (Jellyfin, Immich and Home Assistant skip by pressing
 * Next with the default; here the link says what skipping means). `step` absent
 * is the done screen, which has no number. Phone-first: one column up to 28 rem, as the login card.
 */
export function SetupStep({ step, total, intro, title, help, skipTo, children }: {
  step?: number
  total: number
  /** The welcome line, first screen only. */
  intro?: string
  title: string
  /** One line under the question; a screen whose body carries its own words has none. */
  help?: string
  /** Where "Not sure? Skip for now" goes; absent on a screen whose own buttons are the choice. */
  skipTo?: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 md:p-8">
        <p className="text-3xl font-bold mb-1">
          <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Naviseerr</span>
        </p>
        {step !== undefined && <p className="text-sm text-zinc-400">{step} of {total}</p>}
        {intro && <p className="mt-4 text-sm text-zinc-300">{intro}</p>}
        <h1 className="mt-4 text-lg font-semibold text-zinc-200">{title}</h1>
        {help && <p className="mt-1 text-sm text-zinc-400">{help}</p>}
        <div className="mt-6">{children}</div>
        {skipTo && (
          <p className="mt-6 text-sm">
            <Link
              to={skipTo}
              className="rounded text-green-400 underline underline-offset-2 hover:text-green-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              Not sure? Skip for now
            </Link>
            <span className="mt-1 block text-xs text-zinc-400">You can set this up later in Settings.</span>
          </p>
        )}
      </div>
    </main>
  )
}
