import { Badge } from './ui/badge'

export type FilterType = 'all' | 'songs' | 'albums' | 'artists'

interface FilterPillsProps {
  selected: FilterType
  onSelect: (filter: FilterType) => void
}

export function FilterPills({ selected, onSelect }: FilterPillsProps) {
  const pills: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Songs', value: 'songs' },
    { label: 'Albums', value: 'albums' },
    { label: 'Artists', value: 'artists' },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {pills.map((pill) => (
        <Badge
          key={pill.value}
          onClick={() => onSelect(pill.value)}
          variant={selected === pill.value ? 'default' : 'outline'}
          className={`
            cursor-pointer px-4 py-2 text-sm font-medium transition-colors
            ${
              selected === pill.value
                ? 'bg-green-600 hover:bg-green-500 text-white border-green-600'
                : 'bg-transparent hover:bg-zinc-800 text-zinc-400 border-zinc-700'
            }
          `}
        >
          {pill.label}
        </Badge>
      ))}
    </div>
  )
}
