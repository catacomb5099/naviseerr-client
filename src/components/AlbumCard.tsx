import { Album } from '../api/types'

interface AlbumCardProps {
  album: Album
}

export function AlbumCard({ album}: AlbumCardProps) {
  return (
    <div className="flex-shrink-0 w-40 md:w-48">
      {/* Square Album Icon */}
      <div className="w-40 md:w-48 h-40 md:h-48 mb-3">
        {album.iconURL ? (
          <img
            src={album.iconURL}
            alt={album.name}
            className="w-full h-full object-cover rounded"
            onError={(e) => {
              e.currentTarget.src = ''
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 rounded"></div>
        )}
      </div>

      {/* Album Info */}
      <h3 className="text-white font-medium truncate mb-1">{album.name}</h3>
      <p className="text-sm text-zinc-400 truncate">
        {album.artists.length > 0 ? album.artists.join(', ') : 'Unknown Artist'}
      </p>
      <p className="text-sm text-zinc-500">{album.year}</p>
    </div>
  )
}
