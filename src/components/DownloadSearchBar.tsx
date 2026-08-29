import { useRef } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'

interface DownloadSearchBarProps {
  query: string
  onQueryChange: (query: string) => void
  /** How many rows survive the filter, announced to screen readers while a query is active. */
  matchCount: number
}

/**
 * Home's search bar, visually, with the one honest difference: filtering here is local and
 * immediate, so there is nothing to submit and the green button in that slot undoes the filter
 * instead of applying it. Its label stays "Clear" rather than swapping with the query state - the
 * button is `px-8 font-semibold`, so changing the text would reflow the row on the first keystroke.
 */
export function DownloadSearchBar({ query, onQueryChange, matchCount }: DownloadSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onQueryChange('')
    // Back to the input rather than leaving focus on a button that just disabled itself.
    inputRef.current?.focus()
  }

  return (
    <div className="flex gap-3 mb-6">
      <Input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Filter by song, artist, or album..."
        aria-label="Filter downloads"
        className="flex-1 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
      />
      <Button
        type="button"
        onClick={handleClear}
        disabled={query.length === 0}
        aria-label="Clear downloads filter"
        className="h-12 px-8 bg-green-600 hover:bg-green-500 text-white font-semibold"
      >
        Clear
      </Button>
      <div aria-live="polite" className="sr-only">
        {query.trim() ? `${matchCount} ${matchCount === 1 ? 'download matches' : 'downloads match'}` : ''}
      </div>
    </div>
  )
}
