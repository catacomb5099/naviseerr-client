import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Album, Playlist } from '../api/types'
import { CardLayout } from './cardLayout'
import { ArtistNames } from './ArtistNames'

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

  // The whole card still opens the collection's own page (so the browser owns history and back),
  // but the artist line is a SIBLING of that link, not inside it: a link inside a link is invalid HTML
  // and browsers split it. The link's ::after stretches over the card to keep the year line and the
  // gaps clickable; the artist line sits above it (z-10) so its own links win, but lets clicks beside
  // the names fall through (pointer-events) so the whole card still opens the album. The wrapper is
  // `isolate` so that z-10 stays inside the card and never paints over the download panel in the
  // corner. Same widths and line classes as before, so nothing moves.
  return (
    <div className={`relative isolate text-left ${isGrid ? 'w-full' : 'flex-shrink-0 w-40 md:w-48'}`}>
    <Link
      to={`/${props.kind === 'ALBUM' ? 'album' : 'playlist'}/${encodeURIComponent(item.id)}`}
      className="block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black after:absolute after:inset-0 after:content-['']"
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
    </Link>
      {/* Only an album's artists are artist pages; a playlist's author is a channel, so it stays text. */}
      <span className={`relative z-10 pointer-events-none block text-zinc-400 truncate ${isGrid ? 'text-base' : 'text-sm'}`}>
        <ArtistNames names={names} ids={props.kind === 'ALBUM' ? props.item.artistIds : undefined} />
      </span>
      <span className={`block text-zinc-500 truncate ${isGrid ? 'text-base min-h-6' : 'text-sm min-h-5'}`}>{thirdLine}</span>
    </div>
  )
}
