import { useState } from 'react'
import { Album } from '../api/types'
import { CardLayout } from './cardLayout'

interface AlbumCardProps {
  album: Album
  artistNames?: string[]
  layout?: CardLayout
}

export function AlbumCard({ album, artistNames, layout = 'carousel' }: AlbumCardProps) {
  const [iconFailed, setIconFailed] = useState(false)
  const isGrid = layout === 'grid'

  // Prefer resolved names; album.artists holds IDs, which are meaningless on screen
  const names = artistNames && artistNames.length > 0 ? artistNames : album.artists

  return (
    <div className={isGrid ? 'w-full' : 'flex-shrink-0 w-40 md:w-48'}>
      {/* Square Album Icon */}
      <div className={isGrid ? 'w-full aspect-square mb-3' : 'w-40 md:w-48 h-40 md:h-48 mb-3'}>
        {album.iconURL && !iconFailed ? (
          <img
            src={album.iconURL}
            alt={album.name}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded"
            onError={() => setIconFailed(true)}
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 rounded"></div>
        )}
      </div>

      {/* Album Info */}
      <h3 className={`text-white font-medium truncate mb-1 ${isGrid ? 'text-lg' : ''}`}>
        {album.name}
      </h3>
      <p className={`text-zinc-400 truncate ${isGrid ? 'text-base' : 'text-sm'}`}>
        {names.length > 0 ? names.join(', ') : 'Unknown Artist'}
      </p>
      <p className={`text-zinc-500 ${isGrid ? 'text-base' : 'text-sm'}`}>{album.year}</p>
    </div>
  )
}
