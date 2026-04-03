import { Artist } from '../api/types'

interface ArtistCardProps {
  artist: Artist
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <div className="flex-shrink-0 w-40 text-center">
      {/* Circular Artist Icon */}
      <div className="w-40 h-40 mx-auto mb-3">
        {artist.iconUrl ? (
          <img
            src={artist.iconUrl}
            alt={artist.name}
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              e.currentTarget.src = ''
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 rounded-full"></div>
        )}
      </div>

      {/* Artist Name */}
      <h3 className="text-white font-medium truncate mb-1">{artist.name}</h3>

      {/* Static Label */}
      <p className="text-xs text-zinc-500 uppercase">Artist</p>
    </div>
  )
}
