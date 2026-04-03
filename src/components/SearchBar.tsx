import { useState, FormEvent } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'

interface SearchBarProps {
  onSearch: (query: string) => void
  loading: boolean
}

export function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState('')

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
      <Button
        type="submit"
        disabled={loading || !query.trim()}
        className="h-12 px-8 bg-green-600 hover:bg-green-500 text-white font-semibold"
      >
        {loading ? 'Searching...' : 'Search'}
      </Button>
    </form>
  )
}
