import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import { SongCandidate } from '../api/types'
import { ManualImportTarget, useCandidates } from '../hooks/useCandidates'
import {
  GRADE_LABEL, basename, filterRows, formatBytes, formatOf, formatSpeed, gradeRank, qualityLabel, qualityRank, slotLabel,
  slotRank, sortRows, statusCopy,
} from '../lib/candidates'
import { formatDuration } from '../lib/utils'
import { CandidateTable, Column, Sort } from './CandidateTable'
import { Input } from './ui/input'

interface ManualImportDialogProps {
  /** What to show the files for, or null while closed. */
  target: ManualImportTarget | null
  onClose: () => void
}

const BUTTON = 'rounded-full border border-zinc-700 px-4 h-9 text-sm text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'
const ICON_BUTTON = 'h-8 w-8 inline-flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'

const GRADE_CLASS: Record<string, string> = {
  EXACT: 'bg-green-500/15 text-green-400',
  OTHER_VERSION: 'bg-amber-500/15 text-amber-400',
  UNVERIFIED: 'bg-zinc-700/60 text-zinc-300',
}

const fmt = (c: SongCandidate) => formatOf(c.filename) || c.extension

const SONG_COLUMNS: Column<SongCandidate>[] = [
  {
    key: 'file', label: 'File', sortValue: c => basename(c.filename),
    render: c => <span title={c.filename} className="block max-w-[15rem] truncate">{basename(c.filename)}</span>,
  },
  { key: 'format', label: 'Format', sortValue: c => fmt(c), render: c => fmt(c).toUpperCase() || '—' },
  {
    key: 'quality', label: 'Quality', align: 'right', firstDir: 'desc',
    sortValue: c => qualityRank({ extension: fmt(c), bitrateKbps: c.bitrateKbps }),
    render: c => qualityLabel({ extension: fmt(c), bitrateKbps: c.bitrateKbps }),
  },
  {
    key: 'length', label: 'Length', align: 'right', firstDir: 'desc', sortValue: c => c.lengthSeconds,
    render: c => c.lengthSeconds == null ? '—' : formatDuration(c.lengthSeconds),
  },
  { key: 'size', label: 'Size', align: 'right', firstDir: 'desc', sortValue: c => c.size, render: c => formatBytes(c.size) },
  { key: 'speed', label: 'Speed', align: 'right', firstDir: 'desc', sortValue: c => c.uploadSpeed, render: c => formatSpeed(c.uploadSpeed) },
  { key: 'sharer', label: 'Sharer', sortValue: c => c.username, render: c => c.username },
  { key: 'slot', label: 'Slot / Queue', sortValue: c => slotRank(c), render: c => slotLabel(c) },
  {
    key: 'match', label: 'Match', sortValue: c => gradeRank(c.grade),
    render: c => (
      <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${GRADE_CLASS[c.grade] ?? GRADE_CLASS.UNVERIFIED}`}>
        {GRADE_LABEL[c.grade] ?? c.grade}
      </span>
    ),
  },
]

const SONG_HAYSTACK = (c: SongCandidate) => [basename(c.filename), c.username, fmt(c)]

/** The file list for one song: sort, filter and the empty/searching/none states. Mounted fresh for each
 *  target (keyed by the parent), so the sort and filter start clean every time the dialog opens. */
function SongCandidates({ target, onClose }: { target: ManualImportTarget; onClose: () => void }) {
  const { load, refetch } = useCandidates(target)
  const [sort, setSort] = useState<Sort | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (searchOpen) inputRef.current?.focus() }, [searchOpen])

  const data = load.status === 'ready' ? load.data : null
  const all = useMemo(() => data?.candidates ?? [], [data])
  const rows = useMemo(() => {
    const filtered = filterRows(all, filter, SONG_HAYSTACK)
    if (!sort) return filtered
    const col = SONG_COLUMNS.find(c => c.key === sort.key)
    return col ? sortRows(filtered, col.sortValue, sort.dir) : filtered
  }, [all, filter, sort])

  const message = load.status === 'error' ? load.message : data ? statusCopy('SONG', data.status, data.reason, data.query) : null
  const searching = data?.status === 'SEARCHING'
  const empty = data?.status === 'READY' && all.length === 0
  const showTable = load.status === 'loading' || (data?.status === 'READY' && all.length > 0)
  const filtering = filter.trim().length > 0

  return (
    <div className="relative max-h-[85vh] overflow-y-auto overscroll-contain p-5 sm:p-6" aria-busy={load.status === 'loading'}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold truncate">Choose a file for {target.title}</h2>
          <p className="text-sm text-zinc-400 truncate">
            {data?.query ? <>Soulseek was asked for: <span className="text-zinc-300">“{data.query}”</span></> : ' '}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-none">
          {searchOpen && (
            <Input
              ref={inputRef}
              id="candidate-filter"
              type="search"
              aria-label="Filter files"
              placeholder="Filter files…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="h-8 w-40 sm:w-56 bg-zinc-900 border-zinc-800 placeholder:text-zinc-500 text-sm"
            />
          )}
          <button
            type="button"
            aria-label={searchOpen ? 'Hide the filter' : 'Filter files'}
            aria-expanded={searchOpen}
            aria-controls="candidate-filter"
            onClick={() => { setSearchOpen(o => !o); if (searchOpen) setFilter('') }}
            className={`${ICON_BUTTON} ${searchOpen ? 'text-white bg-white/10' : ''}`}
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={onClose} aria-label="Close" className={ICON_BUTTON}>
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {(message || empty) && (
        <div className="py-12 text-center text-zinc-400">
          <p role="status" className="inline-flex items-center gap-2">
            {searching && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {message ?? 'The search found no files for this song.'}
          </p>
          {!searching && (
            <div><button type="button" onClick={refetch} className={`mt-3 ${BUTTON}`}>Try again</button></div>
          )}
        </div>
      )}

      {showTable && (
        <div className="mt-4 space-y-2">
          <p role="status" className="text-xs text-zinc-400 tabular-nums">
            {load.status === 'loading' ? 'Loading files…' : filtering ? `${rows.length} of ${all.length} files` : `${all.length} files, best match first`}
          </p>
          <CandidateTable
            columns={SONG_COLUMNS}
            rows={rows}
            rowKey={c => `${c.username}|${c.filename}`}
            sort={sort}
            onSort={setSort}
            isCurrent={c => c.isCurrent}
            loading={load.status === 'loading'}
            renderAction={c => c.isCurrent
              ? <span className="text-xs text-zinc-400">{data && data.songStage !== 'SUCCEEDED' && data.songStage !== 'FAILED' ? 'Downloading' : 'Current'}</span>
              : null}
          />
        </div>
      )}
    </div>
  )
}

/** Sonarr-style manual import: every file Soulseek found for a song, as a sortable, filterable table in
 *  a pop-up. A native dialog, so Escape and focus handling are the browser's; there is deliberately NO
 *  click-outside dismiss (the X button closes it), so a stray click cannot wipe a sort or a filter. */
export function ManualImportDialog({ target, onClose }: ManualImportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (target && !dialog.open) dialog.showModal()
    if (!target && dialog.open) dialog.close()
  }, [target])

  if (!target) return <dialog ref={dialogRef} onClose={onClose} />

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={`Choose a file for ${target.title}`}
      className="w-[min(100vw-2rem,72rem)] bg-zinc-900 border border-zinc-800 rounded-xl p-0 text-white backdrop:bg-black/70"
    >
      <SongCandidates key={`${target.downloadId}:${target.taskId ?? ''}`} target={target} onClose={onClose} />
    </dialog>
  )
}
