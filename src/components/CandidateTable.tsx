import { useId, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react'
import { SortDir, SortValue } from '../lib/candidates'

export interface Column<T> {
  key: string
  label: string
  align?: 'left' | 'right'
  /** Which way the first click on the header sorts. Numbers go descending first (the biggest or best
   *  on top is what a person clicking "Speed" wants); text ascending. */
  firstDir?: SortDir
  sortValue: (row: T) => SortValue
  render: (row: T) => ReactNode
}

export interface Sort {
  key: string
  dir: SortDir
}

interface CandidateTableProps<T> {
  columns: Column<T>[]
  /** Already filtered and sorted by the caller; rendered in this order. */
  rows: T[]
  rowKey: (row: T) => string
  /** null = the server's own order ("best match first"), no header marked. */
  sort: Sort | null
  onSort: (sort: Sort) => void
  isCurrent?: (row: T) => boolean
  /** The last column: a status word or a button per row. */
  renderAction?: (row: T) => ReactNode
  /** Skeleton rows under the real header, so the table does not jump when the list lands. */
  loading?: boolean
  /** Albums: what a row unfolds into (its files), behind a chevron in a first column. */
  renderExpanded?: (row: T) => ReactNode
  /** The chevron's accessible name, e.g. "Show files in <folder>". */
  expandLabel?: (row: T) => string
}

const PULSE = 'rounded bg-zinc-800/60 animate-pulse motion-reduce:animate-none'
// The action column stays in view while the rest of the table scrolls sideways (ten columns of real
// Soulseek paths overflow a 1280 px window): a solid background hides what scrolls under it, so the
// current row's tint (white/5 over zinc-900) is spelled out as a colour here. The left shadow marks the
// column as pinned, so a badge half under it reads as scrolled under, not clipped.
const STICKY = 'sticky right-0 shadow-[-6px_0_8px_-6px_rgba(0,0,0,0.7)]'
const HEADER_BUTTON = 'inline-flex items-center gap-1 rounded hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'

/** A sortable table of Soulseek files or folders. One semantic <table> in a sideways-scrolling box, so
 *  every column stays readable on a phone; the headers are real buttons carrying aria-sort. */
export function CandidateTable<T>({ columns, rows, rowKey, sort, onSort, isCurrent, renderAction, loading, renderExpanded, expandLabel }: CandidateTableProps<T>) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const idPrefix = useId()
  const toggle = (key: string) => setExpanded(prev => {
    const next = new Set(prev)
    if (!next.delete(key)) next.add(key)
    return next
  })
  const span = columns.length + (renderAction ? 1 : 0) + (renderExpanded ? 1 : 0)
  const next = (col: Column<T>): Sort => sort?.key === col.key
    ? { key: col.key, dir: sort.dir === 'asc' ? 'desc' : 'asc' }
    : { key: col.key, dir: col.firstDir ?? 'asc' }
  const cellAlign = (col: Column<T>) => col.align === 'right' ? 'text-right tabular-nums' : 'text-left'

  return (
    <div className="overflow-x-auto overscroll-x-contain rounded-lg border border-zinc-800">
      <table className="w-full text-sm whitespace-nowrap">
        <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-400">
          <tr>
            {renderExpanded && <th scope="col" className="w-8 px-1"><span className="sr-only">Files</span></th>}
            {columns.map(col => {
              const active = sort?.key === col.key
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={`px-2.5 py-2 font-medium ${cellAlign(col)}`}
                >
                  <button type="button" className={`${HEADER_BUTTON} ${active ? 'text-white' : ''}`} onClick={() => onSort(next(col))}>
                    {col.label}
                    {active
                      ? sort.dir === 'asc'
                        ? <ArrowUp className="w-3 h-3" aria-hidden="true" />
                        : <ArrowDown className="w-3 h-3" aria-hidden="true" />
                      : <ArrowUpDown className="w-3 h-3 opacity-40" aria-hidden="true" />}
                    <span className="sr-only">{active ? `, sorted ${sort.dir === 'asc' ? 'ascending' : 'descending'}` : ', sort'}</span>
                  </button>
                </th>
              )
            })}
            {renderAction && <th scope="col" className={`px-3 py-2 ${STICKY} bg-zinc-900`}><span className="sr-only">Action</span></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/80">
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
              <tr key={i} aria-hidden="true">
                {renderExpanded && <td className="px-1" />}
                {columns.map(col => (
                  <td key={col.key} className="px-3 py-2.5"><div className={`h-4 ${PULSE} ${col.key === 'file' ? 'w-48' : 'w-14'}`} /></td>
                ))}
                {renderAction && <td className={`px-3 py-2.5 ${STICKY} bg-zinc-900`}><div className={`h-4 w-20 ${PULSE}`} /></td>}
              </tr>
            ))
            : rows.map((row, i) => {
              const key = rowKey(row)
              const current = isCurrent?.(row) ?? false
              const open = renderExpanded ? expanded.has(key) : false
              const panelId = `${idPrefix}-${i}`
              return [
                <tr key={key} aria-current={current || undefined} className={current ? 'bg-white/5' : 'hover:bg-white/[.03]'}>
                  {renderExpanded && (
                    <td className="px-1 py-1.5">
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={open ? panelId : undefined}
                        aria-label={expandLabel?.(row) ?? 'Show files'}
                        onClick={() => toggle(key)}
                        className="w-6 h-6 inline-flex items-center justify-center rounded text-zinc-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-90' : ''}`} aria-hidden="true" />
                      </button>
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} className={`px-2.5 py-2 ${cellAlign(col)} ${current ? 'text-zinc-300' : 'text-zinc-200'}`}>{col.render(row)}</td>
                  ))}
                  {renderAction && <td className={`px-2.5 py-1.5 text-right whitespace-nowrap ${STICKY} ${current ? 'bg-[#232326]' : 'bg-zinc-900'}`}>{renderAction(row)}</td>}
                </tr>,
                open && renderExpanded && (
                  <tr key={`${key}:files`} id={panelId}>
                    <td colSpan={span} className="p-0">{renderExpanded(row)}</td>
                  </tr>
                ),
              ]
            })}
        </tbody>
      </table>
    </div>
  )
}
