import { useState } from 'react'
import { Artist } from '../api/types'
import { CardLayout } from './cardLayout'

interface ArtistCardProps {
  artist: Artist
  layout?: CardLayout
}

export function ArtistCard({ artist, layout = 'carousel' }: ArtistCardProps) {
  const [iconFailed, setIconFailed] = useState(false)
  const isGrid = layout === 'grid'

  return (
    <div className={`text-center ${isGrid ? 'w-full' : 'flex-shrink-0 w-32 md:w-40'}`}>
      {/* Circular Artist Icon */}
      <div className={isGrid ? 'w-full aspect-square mx-auto mb-3' : 'w-32 md:w-40 h-32 md:h-40 mx-auto mb-3'}>
        {artist.iconUrl && !iconFailed ? (
          <img
            src={artist.iconUrl}
            alt={artist.name}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-full"
            onError={() => setIconFailed(true)}
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 rounded-full"></div>
        )}
      </div>

      {/* Artist Name */}
      <h3 className={`text-white font-medium truncate mb-1 ${isGrid ? 'text-lg' : ''}`}>
        {artist.name}
      </h3>

      {/* Static Label */}
      <p className={`text-zinc-500 uppercase ${isGrid ? 'text-sm' : 'text-xs'}`}>Artist</p>
    </div>
  )
}
