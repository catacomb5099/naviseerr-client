import { useState } from 'react'
import { Loader2, Radio } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { startRadio } from '../api/endpoints'
import { ApiError } from '../api/client'
import { cn } from '../lib/utils'

interface StartRadioButtonProps {
  /** A song's videoId, an album's MPREb_ id or a playlist id: whatever the page or row already has. */
  seedId: string
  className?: string
}

type State = 'idle' | 'pending' | 'failed' | 'none'

/**
 * "Start radio": asks the server for songs like this one, then opens the saved radio's page. Each press
 * is a new mix. Inert (not `disabled`) while it works, so a keyboard user's focus stays on it.
 */
export function StartRadioButton({ seedId, className }: StartRadioButtonProps) {
  const navigate = useNavigate()
  const [state, setState] = useState<State>('idle')

  const start = async () => {
    setState('pending')
    try {
      const radio = await startRadio(seedId)
      navigate(`/radio/${encodeURIComponent(radio.id)}`)
    } catch (err) {
      setState(err instanceof ApiError && err.status === 404 ? 'none' : 'failed')
    }
  }

  return (
    <div className={cn('flex flex-col items-start gap-1.5', className)}>
      <button
        type="button"
        onClick={() => { if (state !== 'pending') void start() }}
        aria-disabled={state === 'pending'}
        className="inline-flex items-center gap-2 rounded-full border border-zinc-600 h-10 px-5 font-semibold text-white hover:bg-zinc-800 aria-disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {state === 'pending'
          ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          : <Radio className="w-4 h-4" aria-hidden="true" />}
        {state === 'pending' ? 'Starting radio…' : 'Start radio'}
      </button>
      {state === 'failed' && <p role="status" className="text-xs text-red-400">Couldn't start a radio — try again</p>}
      {state === 'none' && <p role="status" className="text-xs text-zinc-400">YouTube Music has no radio for this one</p>}
    </div>
  )
}
