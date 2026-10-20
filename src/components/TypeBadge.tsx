import { Disc3, ListMusic, Music, Radio } from 'lucide-react'
import { DownloadType } from '../api/types'
import { cn } from '../lib/utils'

// A suggested playlist is a playlist to the user: same word, same icon. Its author line already
// says "Naviseerr", which is all that sets it apart. Your own playlist is a playlist too.
const LABEL: Record<DownloadType, string> = { SONG: 'Song', ALBUM: 'Album', PLAYLIST: 'Playlist', CURATED: 'Playlist', RADIO: 'Radio', CUSTOM: 'Playlist' }
const ICON = { SONG: Music, ALBUM: Disc3, PLAYLIST: ListMusic, CURATED: ListMusic, RADIO: Radio, CUSTOM: ListMusic } as const

interface TypeBadgeProps {
  type: DownloadType | 'RADIO'
  className?: string
  /** Icon only on phones (the word stays for screen readers): for rows where the title needs the width. */
  compact?: boolean
}

/**
 * The one way the app says what kind of thing a row or a header is about. Used as the eyebrow of
 * the collection page and in the downloads table, so the two can never drift apart: a user who
 * learns the badge in one place reads it in the other.
 */
export function TypeBadge({ type, className, compact = false }: TypeBadgeProps) {
  const Icon = ICON[type]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-zinc-300 sm:text-[10px]',
        className,
      )}
    >
      <Icon className={compact ? 'w-3.5 h-3.5 sm:w-2.5 sm:h-2.5' : 'w-2.5 h-2.5'} aria-hidden="true" />
      <span className={compact ? 'sr-only sm:not-sr-only' : undefined}>{LABEL[type]}</span>
    </span>
  )
}
