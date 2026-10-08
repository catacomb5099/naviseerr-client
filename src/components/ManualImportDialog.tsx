import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Search, X } from 'lucide-react'
import { AlbumPick, CandidatePick } from '../api/endpoints'
import { AlbumFolder, SongCandidate } from '../api/types'
import { ActOutcome } from '../hooks/useActiveDownloads'
import { CandidatesLoad, ManualImportTarget, useCandidates } from '../hooks/useCandidates'
import { isTerminal } from '../lib/downloadPanel'
import { REQUEST_FAILED_COPY } from '../pages/CollectionPage'
import {
  GRADE_LABEL, basename, filterRows, formatBytes, formatOf, formatSpeed, gradeRank, qualityLabel, qualityRank, slotLabel,
  slotRank, sortRows, statusCopy,
} from '../lib/candidates'
import { formatDuration } from '../lib/utils'
import { CandidateTable, Column, Sort } from './CandidateTable'
import { Input } from './ui/input'

/** What the person asked for: one song's file (taskId resolved - a single-song row opens the dialog
 *  without one) or one sharer's folder for a whole album. */
export type PickRequest =
  | { kind: 'SONG'; downloadId: string; taskId: string; body: CandidatePick }
  | { kind: 'ALBUM'; downloadId: string; body: AlbumPick }

interface ManualImportDialogProps {
  /** What to show the files for, or null while closed. */
  target: ManualImportTarget | null
  onClose: () => void
  /** Runs the pick through the downloads feed (useActiveDownloads.pick), so the row underneath updates. */
  onPick: (request: PickRequest) => Promise<ActOutcome>
}

const SUCCEEDED_HINT = 'This song is already downloaded and filed. Delete it from your library first to pick another file.'
const ALBUM_SUCCEEDED_HINT = 'Every song of this album is already downloaded and filed. Delete them from your library first to pick another sharer.'
const CONFLICT_COPY = 'That file could not be chosen — the list has been refreshed.'
const GONE_COPY = 'This download no longer exists.'
const BUSY_COPY = 'Another action on this song is still running. Try again in a moment.'
const BUTTON = 'rounded-full border border-zinc-700 px-4 h-9 text-sm text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'
const ICON_BUTTON = 'h-8 w-8 inline-flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'
const DOWNLOAD_BUTTON = 'h-8 px-3 rounded-full text-xs font-semibold text-white bg-green-600 hover:bg-green-500 aria-disabled:bg-zinc-800 aria-disabled:text-zinc-500 aria-disabled:hover:bg-zinc-800 aria-disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'

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

const ALBUM_COLUMNS: Column<AlbumFolder>[] = [
  { key: 'sharer', label: 'Sharer', sortValue: f => f.username, render: f => f.username },
  {
    key: 'folder', label: 'Folder', sortValue: f => basename(f.folder),
    render: f => <span title={f.folder} className="block max-w-[18rem] truncate">{basename(f.folder)}</span>,
  },
  { key: 'files', label: 'Files', align: 'right', firstDir: 'desc', sortValue: f => f.fileCount, render: f => `${f.fileCount}` },
  { key: 'size', label: 'Size', align: 'right', firstDir: 'desc', sortValue: f => f.totalSize, render: f => formatBytes(f.totalSize) },
  { key: 'speed', label: 'Speed', align: 'right', firstDir: 'desc', sortValue: f => f.uploadSpeed, render: f => formatSpeed(f.uploadSpeed) },
  { key: 'slot', label: 'Slot / Queue', sortValue: f => slotRank(f), render: f => slotLabel(f) },
  {
    key: 'current', label: 'Current', align: 'right', firstDir: 'desc', sortValue: f => f.songsCurrent,
    render: f => f.songsCurrent > 0 ? `${f.songsCurrent} ${f.songsCurrent === 1 ? 'song' : 'songs'}` : '—',
  },
]

const ALBUM_HAYSTACK = (f: AlbumFolder) => [f.username, basename(f.folder), ...f.files.map(x => x.extension)]

/** Sort, filter and pick state shared by the song and the album views. Mounted fresh per target. */
function usePickState(onPick: ManualImportDialogProps['onPick'], onClose: () => void, refetch: () => void) {
  const [sort, setSort] = useState<Sort | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [filter, setFilter] = useState('')
  // The row whose pick is on its way, and what the last pick said.
  const [pending, setPending] = useState<string | null>(null)
  const [pickError, setPickError] = useState<string | null>(null)
  const send = async (key: string, request: PickRequest) => {
    if (pending) return
    setPending(key)
    setPickError(null)
    const outcome = await onPick(request)
    setPending(null)
    if (outcome === 'ok') onClose()
    else if (outcome === 'conflict') { setPickError(CONFLICT_COPY); refetch() }
    else if (outcome === 'gone') setPickError(GONE_COPY)
    else if (outcome === 'failed') setPickError(REQUEST_FAILED_COPY)
    else if (outcome === 'busy') setPickError(BUSY_COPY)
  }
  const toggleSearch = () => { setSearchOpen(o => !o); if (searchOpen) setFilter('') }
  return { sort, setSort, searchOpen, toggleSearch, filter, setFilter, pending, pickError, send }
}

/** The header every view shares: title, what Soulseek was asked for, the filter toggle and the X. */
function DialogHeader({ title, query, searchOpen, onToggleSearch, filter, onFilter, onClose }: {
  title: string; query: string | null | undefined; searchOpen: boolean; onToggleSearch: () => void
  filter: string; onFilter: (text: string) => void; onClose: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (searchOpen) inputRef.current?.focus() }, [searchOpen])
  return (
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-bold truncate">{title}</h2>
        <p className="text-sm text-zinc-400 truncate">
          {query ? <>Soulseek was asked for: <span className="text-zinc-300">“{query}”</span></> : ' '}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-none">
        {searchOpen && (
          <Input
            ref={inputRef}
            id="candidate-filter"
            type="search"
            aria-label="Filter files"
            placeholder="Filter…"
            value={filter}
            onChange={e => onFilter(e.target.value)}
            className="h-8 w-40 sm:w-56 bg-zinc-900 border-zinc-800 placeholder:text-zinc-500 text-sm"
          />
        )}
        <button
          type="button"
          aria-label={searchOpen ? 'Hide the filter' : 'Filter files'}
          aria-expanded={searchOpen}
          aria-controls={searchOpen ? 'candidate-filter' : undefined}
          onClick={onToggleSearch}
          className={`${ICON_BUTTON} ${searchOpen ? 'text-white bg-white/10' : ''}`}
        >
          <Search className="w-4 h-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={onClose} aria-label="Close" className={ICON_BUTTON}>
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

/** The one line when there is no table: the server's status sentence, an error, or "nothing found". */
function EmptyState({ message, searching, onRetry }: { message: string; searching: boolean; onRetry: () => void }) {
  return (
    <div className="py-12 text-center text-zinc-400">
      <p role="status" className="inline-flex items-center gap-2">
        {searching && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
        {message}
      </p>
      {!searching && <div><button type="button" onClick={onRetry} className={`mt-3 ${BUTTON}`}>Try again</button></div>}
    </div>
  )
}

/** The greyed button on the row being downloaded now, or a live Download button. aria-disabled, not
 *  disabled: the button stays focusable and its hint readable. */
function RowAction({ current, currentLabel, disabled, hint, pending, onClick }: {
  current: boolean; currentLabel: string; disabled: boolean; hint?: string; pending: boolean; onClick: () => void
}) {
  if (current) return <button type="button" aria-disabled="true" className={DOWNLOAD_BUTTON}>{currentLabel}</button>
  return (
    <button
      type="button"
      aria-disabled={disabled}
      title={hint}
      onClick={onClick}
      className={`${DOWNLOAD_BUTTON} inline-flex items-center gap-1.5`}
    >
      {pending && <Loader2 className="w-3 h-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
      {pending ? 'Switching…' : 'Download'}
    </button>
  )
}

type ViewProps = { target: ManualImportTarget; load: CandidatesLoad; refetch: () => void; onClose: () => void; onPick: ManualImportDialogProps['onPick'] }

/** The file list for one song: sort, filter, the empty/searching/none states, Download per row. */
function SongCandidates({ target, load, refetch, onClose, onPick }: ViewProps) {
  const { sort, setSort, searchOpen, toggleSearch, filter, setFilter, pending, pickError, send } = usePickState(onPick, onClose, refetch)
  // The row waiting for "Replace?".
  const [confirm, setConfirm] = useState<SongCandidate | null>(null)

  const data = load.status === 'ready' && load.kind === 'SONG' ? load.data : null
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
  const succeeded = data?.songStage === 'SUCCEEDED'
  // A transfer is under way (or about to be): picking another file replaces it, so ask first.
  const live = data ? !isTerminal(data.songStage) && data.current !== null : false

  const rowKey = (c: SongCandidate) => `${c.username}|${c.filename}`
  const pickRow = (c: SongCandidate) => {
    if (!data) return
    setConfirm(null)
    void send(rowKey(c), { kind: 'SONG', downloadId: target.downloadId, taskId: data.taskId, body: { username: c.username, filename: c.filename } })
  }
  const choose = (c: SongCandidate) => {
    if (c.isCurrent || succeeded || pending) return
    if (live) setConfirm(c)
    else pickRow(c)
  }

  return (
    <div className="relative max-h-[85vh] overflow-y-auto overscroll-contain p-5 sm:p-6" aria-busy={load.status === 'loading'}>
      <DialogHeader
        title={`Choose a file for ${target.title}`}
        query={data?.query}
        searchOpen={searchOpen}
        onToggleSearch={toggleSearch}
        filter={filter}
        onFilter={setFilter}
        onClose={onClose}
      />

      {(message || empty) && (
        <EmptyState message={message ?? 'The search found no files for this song.'} searching={searching} onRetry={refetch} />
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
            rowKey={rowKey}
            sort={sort}
            onSort={setSort}
            isCurrent={c => c.isCurrent}
            loading={load.status === 'loading'}
            renderAction={c => (
              <RowAction
                current={c.isCurrent}
                currentLabel={data && !isTerminal(data.songStage) ? 'Downloading' : 'Current'}
                disabled={succeeded || pending !== null}
                hint={succeeded ? SUCCEEDED_HINT : undefined}
                pending={pending === rowKey(c)}
                onClick={() => choose(c)}
              />
            )}
          />
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        message={`This will replace your current download of ${target.title}. Replace?`}
        onConfirm={() => { if (confirm) pickRow(confirm) }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}

/** The folder's files, Sonarr-season style under the folder row: #, Name, Quality, Length, Size. */
function FolderFiles({ folder }: { folder: AlbumFolder }) {
  return (
    <div className="ml-8 my-1 mr-2 bg-zinc-900/40 border-l-2 border-zinc-800 rounded-r-md">
      <table className="w-full text-xs">
        <thead className="text-zinc-500">
          <tr>
            <th scope="col" className="px-2.5 py-1 text-right font-medium w-8">#</th>
            <th scope="col" className="px-2.5 py-1 text-left font-medium">Name</th>
            <th scope="col" className="px-2.5 py-1 text-left font-medium">Quality</th>
            <th scope="col" className="px-2.5 py-1 text-right font-medium">Length</th>
            <th scope="col" className="px-2.5 py-1 text-right font-medium">Size</th>
          </tr>
        </thead>
        <tbody className="text-zinc-300">
          {folder.files.map(f => (
            <tr key={f.taskId}>
              <td className="px-2.5 py-1 text-right tabular-nums text-zinc-500">{f.index}</td>
              <td className="px-2.5 py-1" title={`${folder.folder}\\${f.name}`}>{f.name}</td>
              <td className="px-2.5 py-1">{qualityLabel({ extension: formatOf(f.name) || f.extension, bitrateKbps: f.bitrateKbps })}</td>
              <td className="px-2.5 py-1 text-right tabular-nums">{f.lengthSeconds == null ? '—' : formatDuration(f.lengthSeconds)}</td>
              <td className="px-2.5 py-1 text-right tabular-nums">{formatBytes(f.size)}</td>
            </tr>
          ))}
          {folder.extras > 0 && (
            <tr><td /><td colSpan={4} className="px-2.5 py-1 text-zinc-500">+ {folder.extras} other audio {folder.extras === 1 ? 'file' : 'files'} in this folder</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/** The folder list for a whole album: one row per sharer, unfolding into the files it holds. */
function AlbumCandidates({ target, load, refetch, onClose, onPick }: ViewProps) {
  const { sort, setSort, searchOpen, toggleSearch, filter, setFilter, pending, pickError, send } = usePickState(onPick, onClose, refetch)
  const [confirm, setConfirm] = useState<AlbumFolder | null>(null)

  const data = load.status === 'ready' && load.kind === 'ALBUM' ? load.data : null
  const all = useMemo(() => data?.folders ?? [], [data])
  const rows = useMemo(() => {
    const filtered = filterRows(all, filter, ALBUM_HAYSTACK)
    if (!sort) return filtered
    const col = ALBUM_COLUMNS.find(c => c.key === sort.key)
    return col ? sortRows(filtered, col.sortValue, sort.dir) : filtered
  }, [all, filter, sort])
  const songCount = data?.songCount ?? 0
  const columns = useMemo(() => ALBUM_COLUMNS.map(col => col.key === 'files'
    ? { ...col, render: (f: AlbumFolder) => `${f.fileCount} of ${songCount || f.fileCount}` }
    : col), [songCount])

  const message = load.status === 'error' ? load.message : data ? statusCopy('ALBUM', data.status, data.reason, data.query) : null
  const searching = data?.status === 'SEARCHING'
  const empty = data?.status === 'READY' && all.length === 0
  const showTable = load.status === 'loading' || (data?.status === 'READY' && all.length > 0)
  const filtering = filter.trim().length > 0
  // The folder the album downloads from now; replacing it mid-flight is what the confirm is about.
  // songsCurrent counts finished songs too, so the confirm names no number.
  const current = all.find(f => f.isCurrent) ?? null
  const live = target.kind === 'ALBUM' && !isTerminal(target.stage) && (current?.songsCurrent ?? 0) > 0
  // Every song filed: the server would answer 409 to any folder, so say why up front (as the song view does).
  const succeeded = target.kind === 'ALBUM' && target.stage === 'SUCCEEDED'

  const rowKey = (f: AlbumFolder) => `${f.username}|${f.folder}`
  const pickRow = (f: AlbumFolder) => {
    setConfirm(null)
    void send(rowKey(f), { kind: 'ALBUM', downloadId: target.downloadId, body: { username: f.username, folder: f.folder } })
  }
  const choose = (f: AlbumFolder) => {
    if (f.isCurrent || succeeded || pending) return
    if (live) setConfirm(f)
    else pickRow(f)
  }

  return (
    <div className="relative max-h-[85vh] overflow-y-auto overscroll-contain p-5 sm:p-6" aria-busy={load.status === 'loading'}>
      <DialogHeader
        title={`Choose a sharer for ${target.title}`}
        query={data?.query}
        searchOpen={searchOpen}
        onToggleSearch={toggleSearch}
        filter={filter}
        onFilter={setFilter}
        onClose={onClose}
      />

      {(message || empty) && (
        <EmptyState message={message ?? 'The search found no folders holding this album.'} searching={searching} onRetry={refetch} />
      )}

      {showTable && (
        <div className="mt-4 space-y-2">
          <div className="flex items-baseline justify-between gap-3 flex-wrap text-xs">
            <p role="status" className="text-zinc-400 tabular-nums">
              {load.status === 'loading' ? 'Loading folders…'
                : filtering ? `${rows.length} of ${all.length} folders`
                : `${all.length} ${all.length === 1 ? 'folder' : 'folders'}, best match first · ${songCount} songs on the album`}
            </p>
            {succeeded && <p className="text-zinc-400">{ALBUM_SUCCEEDED_HINT}</p>}
            {pickError && <p role="status" className="text-red-400">{pickError}</p>}
          </div>
          <CandidateTable
            columns={columns}
            rows={rows}
            rowKey={rowKey}
            sort={sort}
            onSort={setSort}
            isCurrent={f => f.isCurrent}
            loading={load.status === 'loading'}
            renderExpanded={f => <FolderFiles folder={f} />}
            expandLabel={f => `Show files in ${basename(f.folder)}`}
            renderAction={f => (
              <RowAction
                current={f.isCurrent}
                currentLabel={f.songsCurrent > 0 && !succeeded ? 'Downloading' : 'Current'}
                disabled={succeeded || pending !== null}
                hint={succeeded ? ALBUM_SUCCEEDED_HINT : undefined}
                pending={pending === rowKey(f)}
                onClick={() => choose(f)}
              />
            )}
          />
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        message={`Replace the songs still downloading from ${current?.username ?? 'the current sharer'}'s folder? Songs already finished are kept.`}
        onConfirm={() => { if (confirm) pickRow(confirm) }}
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

/** Sonarr-style manual import: every file Soulseek found for a song (or every sharer's folder for an
 *  album), as a sortable, filterable table in a pop-up. A native dialog, so Escape and focus handling
 *  are the browser's; there is deliberately NO click-outside dismiss (the X button closes it), so a
 *  stray click cannot wipe a sort or a filter. */
export function ManualImportDialog({ target, onClose, onPick }: ManualImportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { load, refetch } = useCandidates(target)

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
      aria-label={target.kind === 'ALBUM' ? `Choose a sharer for ${target.title}` : `Choose a file for ${target.title}`}
      className="w-[min(100vw-2rem,80rem)] bg-zinc-900 border border-zinc-800 rounded-xl p-0 text-white backdrop:bg-black/70"
    >
      {/* Keyed per target so the sort, filter and confirm start clean every time it opens. */}
      {target.kind === 'ALBUM'
        ? <AlbumCandidates key={`ALBUM:${target.downloadId}`} target={target} load={load} refetch={refetch} onClose={onClose} onPick={onPick} />
        : <SongCandidates key={`SONG:${target.downloadId}:${target.taskId ?? ''}`} target={target} load={load} refetch={refetch} onClose={onClose} onPick={onPick} />}
    </dialog>
  )
}
