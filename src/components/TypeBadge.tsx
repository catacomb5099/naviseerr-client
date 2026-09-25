import { Disc3, ListMusic, Music } from 'lucide-react'
import { DownloadType } from '../api/types'
import { cn } from '../lib/utils'

const LABEL: Record<DownloadType, string> = { SONG: 'Song', ALBUM: 'Album', PLAYLIST: 'Playlist' }
const ICON = { SONG: Music, ALBUM: Disc3, PLAYLIST: ListMusic } as const

interface TypeBadgeProps {
  type: DownloadType
  className?: string
}

/**
 * The one way the app says what kind of thing a row or a header is about. Used as the eyebrow of
 * the collection dialog and in the downloads table, so the two can never drift apart: a user who
 * learns the badge in one place reads it in the other.
 */
export function TypeBadge({ type, className }: TypeBadgeProps) {
  const Icon = ICON[type]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300',
        className,
      )}
    >
      <Icon className="w-2.5 h-2.5" aria-hidden="true" />
      {LABEL[type]}
    </span>
  )
}
