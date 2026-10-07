import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import { CandidatePick } from '../api/endpoints'
import { SongCandidate } from '../api/types'
import { ActOutcome } from '../hooks/useActiveDownloads'
import { ManualImportTarget, useCandidates } from '../hooks/useCandidates'
import { isTerminal } from '../lib/downloadPanel'
import { REQUEST_FAILED_COPY } from '../pages/CollectionPage'
import {
  GRADE_LABEL, basename, filterRows, formatBytes, formatOf, formatSpeed, gradeRank, qualityLabel, qualityRank, slotLabel,
  slotRank, sortRows, statusCopy,
} from '../lib/candidates'
import { formatDuration } from '../lib/utils'
import { CandidateTable, Column, Sort } from './CandidateTable'
import { Input } from './ui/input'

/** The pick, with the song's taskId resolved (a single-song row opens the dialog without one). */
export type PickTarget = ManualImportTarget & { taskId: string }

interface ManualImportDialogProps {
  /** What to show the files for, or null while closed. */
  target: ManualImportTarget | null
  onClose: () => void
  /** Runs the pick through the downloads feed (useActiveDownloads.pick), so the row underneath updates. */
  onPick: (target: PickTarget, body: CandidatePick) => Promise<ActOutcome>
}

const SUCCEEDED_HINT = 'This song is already downloaded and filed. Delete it from your library first to pick another file.'
const CONFLICT_COPY = 'That file could not be chosen — the list has been refreshed.'
const GONE_COPY = 'This download no longer exists.'
const BUSY_COPY = 'Another action on this song is still running. Try again in a moment.'
const DOWNLOAD_BUTTON = 'h-8 px-3 rounded-full text-xs font-semibold text-white bg-green-600 hover:bg-green-500 aria-disabled:bg-zinc-800 aria-disabled:text-zinc-500 aria-disabled:hover:bg-zinc-800 aria-disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'

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
function SongCandidates({ target, onClose, onPick }: { target: ManualImportTarget; onClose: () => void; onPick: ManualImportDialogProps['onPick'] }) {
  const { load, refetch } = useCandidates(target)
  const [sort, setSort] = useState<Sort | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [filter, setFilter] = useState('')
  // The row waiting for "Replace?", the row whose pick is on its way, and what the last pick said.
  const [confirm, setConfirm] = useState<SongCandidate | null>(null)
  const [pending, setPending] = useState<SongCandidate | null>(null)
  const [pickError, setPickError] = useState<string | null>(null)
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
  const succeeded = data?.songStage === 'SUCCEEDED'
  // A transfer is under way (or about to be): picking another file replaces it, so ask first.
  const live = data ? !isTerminal(data.songStage) && data.current !== null : false

  const send = async (c: SongCandidate) => {
    if (!data || pending) return
    setConfirm(null)
    setPending(c)
    setPickError(null)
    const outcome = await onPick({ ...target, taskId: data.taskId }, { username: c.username, filename: c.filename })
    setPending(null)
    if (outcome === 'ok') onClose()
    else if (outcome === 'conflict') { setPickError(CONFLICT_COPY); refetch() }
    else if (outcome === 'gone') setPickError(GONE_COPY)
    else if (outcome === 'failed') setPickError(REQUEST_FAILED_COPY)
    else if (outcome === 'busy') setPickError(BUSY_COPY)
  }
  const choose = (c: SongCandidate) => {
    if (c.isCurrent || succeeded || pending) return
    if (live) setConfirm(c)
    else void send(c)
  }
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
            aria-controls={searchOpen ? 'candidate-filter' : undefined}
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
          <div className="flex items-baseline justify-between gap-3 flex-wrap text-xs">
            <p role="status" className="text-zinc-400 tabular-nums">
              {load.status === 'loading' ? 'Loading files…' : filtering ? `${rows.length} of ${all.length} files` : `${all.length} files, best match first`}
            </p>
            {succeeded && <p className="text-zinc-400">{SUCCEEDED_HINT}</p>}
            {pickError && <p role="status" className="text-red-400">{pickError}</p>}
          </div>
          <CandidateTable
            columns={SONG_COLUMNS}
            rows={rows}
            rowKey={c => `${c.username}|${c.filename}`}
            sort={sort}
            onSort={setSort}
            isCurrent={c => c.isCurrent}
            loading={load.status === 'loading'}
            renderAction={c => c.isCurrent
              ? (
                <button type="button" aria-disabled="true" className={DOWNLOAD_BUTTON}>
                  {data && !isTerminal(data.songStage) ? 'Downloading' : 'Current'}
                </button>
              ) : (
                // aria-disabled, not disabled: the button stays focusable and its hint readable.
                <button
                  type="button"
                  aria-disabled={succeeded || pending !== null}
                  title={succeeded ? SUCCEEDED_HINT : undefined}
                  onClick={() => choose(c)}
                  className={`${DOWNLOAD_BUTTON} inline-flex items-center gap-1.5`}
                >
                  {pending === c && <Loader2 className="w-3 h-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                  {pending === c ? 'Switching…' : 'Download'}
                </button>
              )}
          />
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        message={`This will replace your current download of ${target.title}. Replace?`}
        onConfirm={() => { if (confirm) void send(confirm) }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}

/** A small native dialog on top of the main one: Escape or "Keep current" closes only this layer. */
function ConfirmDialog({ open, message, onConfirm, onCancel }: { open: boolean; message: string; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      // React re-dispatches a dialog's close event up the tree, so without this the main dialog's
      // onClose would fire too and "Keep current" would close everything.
      onClose={e => { e.stopPropagation(); onCancel() }}
      aria-label="Replace the current download?"
      className="w-[min(100vw-2rem,26rem)] bg-zinc-900 border border-zinc-700 rounded-xl p-6 text-white backdrop:bg-black/60"
    >
      {open && (
        <>
          <p className="text-base">{message}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onCancel} className={BUTTON}>Keep current</button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-full h-9 px-4 text-sm font-semibold text-white bg-green-600 hover:bg-green-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Replace
            </button>
          </div>
        </>
      )}
    </dialog>
  )
}

/** Sonarr-style manual import: every file Soulseek found for a song, as a sortable, filterable table in
 *  a pop-up. A native dialog, so Escape and focus handling are the browser's; there is deliberately NO
 *  click-outside dismiss (the X button closes it), so a stray click cannot wipe a sort or a filter. */
export function ManualImportDialog({ target, onClose, onPick }: ManualImportDialogProps) {
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
      className="w-[min(100vw-2rem,80rem)] bg-zinc-900 border border-zinc-800 rounded-xl p-0 text-white backdrop:bg-black/70"
    >
      <SongCandidates key={`${target.downloadId}:${target.taskId ?? ''}`} target={target} onClose={onClose} onPick={onPick} />
    </dialog>
  )
}
