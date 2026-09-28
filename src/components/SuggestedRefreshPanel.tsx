import { Loader2, Sparkles } from 'lucide-react'
import { SuggestedRefresh } from '../hooks/useSuggestedRefresh'
import { categoryDone, categoryName, categoryStatusCopy, runSummary } from '../lib/suggested'

interface SuggestedRefreshPanelProps {
  /** What is missing, e.g. "This week's playlists aren't ready yet." */
  message: string
  /** From useSuggestedRefresh, owned by the page or shelf: it must outlive this panel, which unmounts
   *  while the caller fetches again, or the run's outcome would be lost with it. */
  refresh: SuggestedRefresh
}

const BUTTON = 'inline-flex items-center gap-2 rounded-full bg-white text-black px-4 h-9 text-sm font-semibold hover:bg-zinc-200 aria-disabled:bg-zinc-700 aria-disabled:text-zinc-300 aria-disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black'

/**
 * The "not ready yet" state with a way out: ask the server to make the playlists now, then watch the run
 * category by category until it is over. No streaming service offers this button; naviseerr can, because
 * the user owns the server. White, not green: green is reserved for downloads.
 */
export function SuggestedRefreshPanel({ message, refresh }: SuggestedRefreshPanelProps) {
  const { run, requesting, error, request } = refresh
  const working = requesting || (run !== null && !run.final)
  const showCategories = run !== null && (!run.final || run.categories.some(c => c.status !== 'written' && c.status !== 'exists'))

  return (
    <div className="text-zinc-400">
      {run ? (
        <p role="status">{runSummary(run)}</p>
      ) : (
        <p role="status">{message}</p>
      )}
      {showCategories && run && (
        <ul className="mt-2 space-y-0.5 text-sm">
          {run.categories.map(c => (
            <li key={c.key} className="flex items-baseline gap-2">
              <span className="text-zinc-300">{categoryName(c.key)}</span>
              <span className="text-zinc-500">
                {categoryStatusCopy(c.status)}
                {/* The curator's own line explains a category that got nothing. */}
                {run.final && categoryDone(c.status) && c.status !== 'written' && c.status !== 'exists' && c.message ? ` (${c.message})` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}
      <button
        type="button"
        onClick={() => { if (!working) request() }}
        aria-disabled={working}
        className={`mt-3 ${BUTTON}`}
      >
        {working ? (
          <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        ) : (
          <Sparkles className="w-4 h-4" aria-hidden="true" />
        )}
        {requesting ? 'Asking…' : working ? 'Making them…' : run ? 'Try again' : "Make this week's playlists now"}
      </button>
    </div>
  )
}
