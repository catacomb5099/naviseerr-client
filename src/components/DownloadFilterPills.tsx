import { DownloadType } from '../api/types'

export type DownloadFilter = 'all' | DownloadType

const PILLS: { label: string; value: DownloadFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Songs', value: 'SONG' },
  { label: 'Albums', value: 'ALBUM' },
  { label: 'Playlists', value: 'PLAYLIST' },
]

interface DownloadFilterPillsProps {
  selected: DownloadFilter
  onSelect: (filter: DownloadFilter) => void
}

/** White-on-black pills, not green: green is reserved for success and download on this page. */
export function DownloadFilterPills({ selected, onSelect }: DownloadFilterPillsProps) {
  return (
    <div role="group" aria-label="Filter downloads" className="flex gap-2 overflow-x-auto pb-2">
      {PILLS.map(pill => (
        <button
          key={pill.value}
          type="button"
          aria-pressed={selected === pill.value}
          onClick={() => onSelect(pill.value)}
          className={`rounded-full h-8 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
            selected === pill.value ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }`}
        >
          {pill.label}
        </button>
      ))}
    </div>
  )
}
