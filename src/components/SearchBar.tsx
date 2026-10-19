import { useState, FormEvent } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'

interface SearchBarProps {
  onSearch: (query: string) => void
  loading: boolean
  /** What the box shows on mount - the query from the URL, so coming back to the page reads right. */
  initialQuery?: string
}

export function SearchBar({ onSearch, loading, initialQuery = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for songs, albums, artists..."
        disabled={loading}
        className="flex-1 h-12 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
      />
      {/* Icon only on phones, so the box gets the width; the word from tablet up. */}
      <Button
        type="submit"
        disabled={loading || !query.trim()}
        aria-label="Search"
        className="h-12 w-12 px-0 sm:w-auto sm:px-8 bg-green-600 hover:bg-green-500 text-white font-semibold"
      >
        {loading
          ? <Loader2 className="sm:hidden animate-spin motion-reduce:animate-none" aria-hidden="true" />
          : <Search className="sm:hidden" aria-hidden="true" />}
        <span className="hidden sm:inline">{loading ? 'Searching...' : 'Search'}</span>
      </Button>
    </form>
  )
}
