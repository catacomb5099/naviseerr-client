import { X } from 'lucide-react'
import { badgeVariants } from './ui/badge'
import { FilterType } from './FilterPills'
import {
  FILTER_PILL_OPTIONS, PILL_BASE, PILL_FOCUS, PILL_ICON, PILL_ROW, PILL_SELECTED, PILL_UNSELECTED,
} from './filterPillStyles'
import { cn } from '../lib/utils'

interface DownloadFilterPillsProps {
  selected: FilterType
  onSelect: (filter: FilterType) => void
}

/**
 * The Downloads page's filter row. Same pills as Home, one difference: once a filter is chosen the
 * row collapses to just that pill with a clear button beside it, so the filter in force is the only
 * thing competing for attention above the list.
 *
 * A sibling of `FilterPills` rather than a mode on it: these pills are real buttons, and Home's are
 * divs whose focus order must not change.
 */
export function DownloadFilterPills({ selected, onSelect }: DownloadFilterPillsProps) {
  // 'all' is the cleared state - nothing to clear and nothing to hide.
  const collapsed = selected !== 'all'
  const shown = collapsed
    ? FILTER_PILL_OPTIONS.filter(option => option.value === selected)
    : FILTER_PILL_OPTIONS

  return (
    <div className={PILL_ROW} role="group" aria-label="Filter downloads">
      {collapsed && (
        <button
          type="button"
          onClick={() => onSelect('all')}
          aria-label="Clear filter"
          className={cn(badgeVariants({ variant: 'outline' }), PILL_ICON, PILL_UNSELECTED, PILL_FOCUS, 'flex-none')}
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      )}

      {shown.map(pill => {
        const isSelected = selected === pill.value
        return (
          <button
            key={pill.value}
            type="button"
            // Re-pressing the pill in force clears it, so the collapsed row is escapable without
            // aiming for the small clear button.
            onClick={() => onSelect(isSelected ? 'all' : pill.value)}
            aria-pressed={isSelected}
            className={cn(
              badgeVariants({ variant: isSelected ? 'default' : 'outline' }),
              PILL_BASE,
              isSelected ? PILL_SELECTED : PILL_UNSELECTED,
              PILL_FOCUS,
              'flex-none',
            )}
          >
            {pill.label}
          </button>
        )
      })}
    </div>
  )
}
