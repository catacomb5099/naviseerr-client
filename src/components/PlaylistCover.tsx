import { ListMusic } from 'lucide-react'
import { imageSrc } from '../api/client'
import { coverOf } from '../lib/playlists'

interface PlaylistCoverProps {
  coverUrl: string | null
  mosaic: string[]
  className?: string
}

const IMG = 'h-full w-full object-cover'

/** Your playlist's cover: your picture, else a 2x2 of four song pictures, else the first one, else a note on a
 *  grey square. Only phrasing content (span), so it can sit inside a link. */
export function PlaylistCover({ coverUrl, mosaic, className = '' }: PlaylistCoverProps) {
  const cover = coverOf(coverUrl, mosaic)
  return (
    <span aria-hidden="true" className={`block overflow-hidden rounded-md bg-zinc-800 shadow-lg ${className}`}>
      {cover.kind === 'picture' && <img src={imageSrc(cover.src)} alt="" className={IMG} />}
      {cover.kind === 'single' && <img src={cover.src} alt="" referrerPolicy="no-referrer" className={IMG} />}
      {cover.kind === 'grid' && (
        <span className="grid h-full w-full grid-cols-2 grid-rows-2">
          {cover.srcs.map(src => <img key={src} src={src} alt="" referrerPolicy="no-referrer" className={IMG} />)}
        </span>
      )}
      {cover.kind === 'empty' && (
        <span className="flex h-full w-full items-center justify-center text-zinc-500">
          <ListMusic className="h-1/3 w-1/3" />
        </span>
      )}
    </span>
  )
}
