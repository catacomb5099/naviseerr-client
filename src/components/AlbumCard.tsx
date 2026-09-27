import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Album, Playlist } from '../api/types'
import { CardLayout } from './cardLayout'

type AlbumCardProps = ({ kind: 'ALBUM'; item: Album } | { kind: 'PLAYLIST'; item: Playlist }) & {
  layout?: CardLayout
}

/** One card for both collection kinds: the art, the name, the artists, and a kind-specific third
 *  line (album year; playlist song count, or a static "Playlist" label when the search endpoint
 *  sends trackCount 0, which today is always). An album with no year keeps the line's height, so
 *  cards in a row line up. */
export function AlbumCard(props: AlbumCardProps) {
  const { item, layout = 'carousel' } = props
  const [iconFailed, setIconFailed] = useState(false)
  const isGrid = layout === 'grid'

  const names = item.artists
  const thirdLine = props.kind === 'ALBUM'
    ? (props.item.year || '')
    : props.item.trackCount > 0
      ? `${props.item.trackCount} songs`
      : 'Playlist'

  // The whole card is one link to the collection's own page, so the browser owns history and back.
  return (
    <Link
      to={`/${props.kind === 'ALBUM' ? 'album' : 'playlist'}/${encodeURIComponent(item.id)}`}
      className={`block text-left rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${isGrid ? 'w-full' : 'flex-shrink-0 w-40 md:w-48'}`}
    >
      {/* Only phrasing content (span/img) is valid inside a link; the name below is the label. */}
      <span className={`block ${isGrid ? 'w-full aspect-square mb-3' : 'w-40 md:w-48 h-40 md:h-48 mb-3'}`}>
        {item.iconURL && !iconFailed ? (
          <img
            src={item.iconURL}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded"
            onError={() => setIconFailed(true)}
          />
        ) : (
          <span className="block w-full h-full bg-zinc-800 rounded"></span>
        )}
      </span>

      {/* Album Info */}
      <span className={`block text-white font-medium truncate mb-1 ${isGrid ? 'text-lg' : ''}`}>
        {item.name}
      </span>
      <span className={`block text-zinc-400 truncate ${isGrid ? 'text-base' : 'text-sm'}`}>
        {names.length > 0 ? names.join(', ') : 'Unknown Artist'}
      </span>
      <span className={`block text-zinc-500 truncate ${isGrid ? 'text-base min-h-6' : 'text-sm min-h-5'}`}>{thirdLine}</span>
    </Link>
  )
}
