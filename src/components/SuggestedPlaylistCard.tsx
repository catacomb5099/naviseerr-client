import { Link } from 'react-router-dom'
import { SuggestedPlaylistSummary } from '../api/types'
import { editionLabel } from '../lib/suggested'
import { SuggestedPlaylistCover } from './SuggestedPlaylistCover'

/** One card on the "Made for you" shelf: cover, title, how fresh it is, how many songs. The same widths
 *  as AlbumCard in a carousel so the shelves line up. The whole card is one link to the playlist's page. */
export function SuggestedPlaylistCard({ playlist }: { playlist: SuggestedPlaylistSummary }) {
  return (
    <Link
      to={`/suggested/${encodeURIComponent(playlist.category)}`}
      className="block flex-shrink-0 w-40 md:w-48 text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      <SuggestedPlaylistCover category={playlist.category} title={playlist.title} className="w-40 md:w-48 h-40 md:h-48 mb-3" />
      <span className="block text-white font-medium truncate mb-1">{playlist.title}</span>
      <span className="block text-zinc-400 text-sm truncate">{editionLabel(playlist.editionDate)}</span>
      <span className="block text-zinc-500 text-sm truncate min-h-5">{playlist.trackCount} songs</span>
    </Link>
  )
}
