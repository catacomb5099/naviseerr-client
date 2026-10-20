import { ListPlus } from 'lucide-react'
import { AddTarget, useAddToPlaylist } from '../hooks/useAddToPlaylist'
import { cn } from '../lib/utils'

const ROW = 'hidden sm:inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'
const HEADER = 'inline-flex items-center gap-2 rounded-full border border-zinc-700 h-10 px-5 font-semibold text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'

/** "Add to playlist" on a row (an icon, hidden on phones where the row has no room: there it is in the song's
 *  details pop-up) or in a page header (the words). */
export function AddToPlaylistButton({ target, header = false, className }: { target: AddTarget; header?: boolean; className?: string }) {
  const open = useAddToPlaylist()
  return (
    <button
      type="button"
      onClick={() => open(target)}
      aria-label={header ? undefined : `Add ${target.title} to a playlist`}
      title={header ? undefined : 'Add to playlist'}
      className={cn(header ? HEADER : ROW, className)}
    >
      <ListPlus className="w-4 h-4" aria-hidden="true" />
      {header && 'Add to playlist'}
    </button>
  )
}
