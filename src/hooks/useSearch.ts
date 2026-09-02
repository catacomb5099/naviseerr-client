import { useState } from 'react'
import { FilterType } from '../components/FilterPills'
import { search, searchSongs, searchAlbums, searchArtists } from '../api/endpoints'
import { SearchResponse } from '../api/types'

export interface Search {
  query: string
  results: SearchResponse | null
  loading: boolean
  error: string | null
  selectedPill: FilterType
  runSearch: (searchQuery: string, filter?: FilterType) => Promise<void>
  changePill: (filter: FilterType) => void
}

/**
 * Lifted out of HomePage so App can hold it: with real routes the inactive page unmounts, and a
 * search surviving a trip to Downloads and back is a deliberate behaviour this hook exists to
 * preserve.
 */
export function useSearch(): Search {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPill, setSelectedPill] = useState<FilterType>('all')

  const runSearch = async (searchQuery: string, filter?: FilterType) => {
    setQuery(searchQuery)
    setResults(null) // Clear old results before new search
    setLoading(true)
    setError(null)

    // Use provided filter or fall back to current selectedPill
    const activeFilter = filter ?? selectedPill

    try {
      let data: SearchResponse

      if (activeFilter === 'all') {
        data = await search(searchQuery)
      } else if (activeFilter === 'songs') {
        const tracks = await searchSongs(searchQuery)
        data = { tracks, albums: [], artists: [] }
      } else if (activeFilter === 'albums') {
        const { albums, artists } = await searchAlbums(searchQuery)
        data = { tracks: [], albums, artists }
      } else {
        // artists
        const artists = await searchArtists(searchQuery)
        data = { tracks: [], albums: [], artists }
      }

      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  const changePill = (filter: FilterType) => {
    setSelectedPill(filter)
    // Re-run search with new filter if we have a query
    if (query) {
      runSearch(query, filter) // Pass the new filter directly
    }
  }

  return { query, results, loading, error, selectedPill, runSearch, changePill }
}
