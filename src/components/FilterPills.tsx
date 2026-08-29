import { Badge } from './ui/badge'
import { FILTER_PILL_OPTIONS, PILL_BASE, PILL_ROW, PILL_SELECTED, PILL_UNSELECTED } from './filterPillStyles'

export type FilterType = 'all' | 'songs' | 'albums' | 'artists'

interface FilterPillsProps {
  selected: FilterType
  onSelect: (filter: FilterType) => void
}

export function FilterPills({ selected, onSelect }: FilterPillsProps) {
  return (
    <div className={PILL_ROW}>
      {FILTER_PILL_OPTIONS.map((pill) => (
        <Badge
          key={pill.value}
          onClick={() => onSelect(pill.value)}
          variant={selected === pill.value ? 'default' : 'outline'}
          className={`
            ${PILL_BASE}
            ${
              selected === pill.value
                ? PILL_SELECTED
                : PILL_UNSELECTED
            }
          `}
        >
          {pill.label}
        </Badge>
      ))}
    </div>
  )
}
