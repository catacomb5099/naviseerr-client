import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Artist } from '../api/types'
import { CardLayout } from './cardLayout'

interface ArtistCardProps {
  artist: Artist
  layout?: CardLayout
}

export function ArtistCard({ artist, layout = 'carousel' }: ArtistCardProps) {
  const [iconFailed, setIconFailed] = useState(false)
  const isGrid = layout === 'grid'

  // The whole card is one link to the artist's own page, so the browser owns history and back.
  return (
    <Link
      to={`/artist/${encodeURIComponent(artist.id)}`}
      className={`block text-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${isGrid ? 'w-full' : 'flex-shrink-0 w-32 md:w-40'}`}
    >
      {/* Only phrasing content (span/img) is valid inside a link; the name below is the label. */}
      <span className={`block mx-auto mb-3 ${isGrid ? 'w-full aspect-square' : 'w-32 md:w-40 h-32 md:h-40'}`}>
        {artist.iconUrl && !iconFailed ? (
          <img
            src={artist.iconUrl}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-full"
            onError={() => setIconFailed(true)}
          />
        ) : (
          <span className="block w-full h-full bg-zinc-800 rounded-full"></span>
        )}
      </span>

      {/* Artist Name */}
      <span className={`block text-white font-medium truncate mb-1 ${isGrid ? 'text-lg' : ''}`}>
        {artist.name}
      </span>

      {/* Static Label */}
      <span className={`block text-zinc-500 uppercase ${isGrid ? 'text-sm' : 'text-xs'}`}>Artist</span>
    </Link>
  )
}
