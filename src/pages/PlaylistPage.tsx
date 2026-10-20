import { type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, Copy, GripVertical, Info, Loader2, Trash2, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { copyPlaylist, deletePlaylist, getPlaylist, getPlaylists, removeFromPlaylist, reorderPlaylist, updatePlaylist } from '../api/endpoints'
import { ApiError } from '../api/client'
import { CollectionTrack, DownloadType, PlaylistDetail, PlaylistSummary } from '../api/types'
import { useRetry } from '../hooks/useRetry'
import { useDownloadCards } from '../hooks/useItemDownload'
import { DownloadMetaInput } from '../lib/downloadLibrary'
import { RequestOutcome, alreadyCopy, itemDownload, itemDownloadLabel } from '../lib/downloadPanel'
import { DESCRIPTION_MAX, TITLE_MAX, dropIndex, mosaicOf, moveItem, playlistMeta, titleClash } from '../lib/playlists'
import { formatDuration, providerMessage, shortDate } from '../lib/utils'
import { AppHeader } from '../components/AppHeader'
import { PageNavButton } from '../components/PageNavButton'
import { TypeBadge } from '../components/TypeBadge'
import { PlaylistCover } from '../components/PlaylistCover'
import { PlayOnYouTubeMusic } from '../components/PlayOnYouTubeMusic'
import { ArtistNames } from '../components/ArtistNames'
import { AddToPlaylistButton } from '../components/AddToPlaylistButton'

interface PlaylistPageProps {
  /** "Create" is a CUSTOM download of this playlist, through the same plumbing as every Download button. */
  onDownload: (id: string, type: DownloadType, meta: DownloadMetaInput) => Promise<RequestOutcome>
  onInfo: (videoId: string, plays?: string | null) => void
}

type Load =
  | { status: 'loading' }
  | { status: 'notFound' }
  | { status: 'error'; problem: string | null }
  | { status: 'ready'; playlist: PlaylistDetail }

const OUTLINE = 'inline-flex items-center gap-2 rounded-full border border-zinc-700 h-10 px-5 font-semibold text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
const ICON_BUTTON = 'inline-flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'
const SAVE_FAILED = "Couldn't save that — try again"

/** A line of text that is edited where it stands: click, type, Enter or leaving the field saves, Esc puts it back. */
function InPlaceText({ value, label, placeholder, maxLength, required, className, onSave }: {
  value: string
  label: string
  placeholder?: string
  maxLength: number
  /** A blank entry puts the old text back instead of saving. */
  required?: boolean
  className: string
  onSave: (text: string) => void
}) {
  const [text, setText] = useState<string | null>(null)
  const commit = () => {
    const next = text?.trim()
    setText(null)
    if (next === undefined || next === value || (required && next === '')) return
    onSave(next)
  }
  return (
    <input
      value={text ?? value}
      aria-label={label}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={e => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur()
        // Put back first: the blur that follows then has nothing to save.
        if (e.key === 'Escape') { setText(null); e.currentTarget.blur() }
      }}
      className={`w-full rounded bg-transparent hover:bg-white/5 focus:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 placeholder:text-zinc-500 ${className}`}
    />
  )
}

/**
 * One of your playlists (Spotify's playlist page): the cover, the name and description edited in place, then the
 * songs in your order. A draft can change; "Create" downloads it in that order and puts it in your music app,
 * and from then on it is kept as it was: Duplicate it to make changes.
 */
export function PlaylistPage({ onDownload, onInfo }: PlaylistPageProps) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [attempt, retry] = useRetry(id)
  // Keyed by what was fetched, like the collection page. A reload of the same playlist (after Create, or a
  // refused edit) keeps the page up while it asks; another playlist starts blank.
  const [fetched, setFetched] = useState<(Exclude<Load, { status: 'loading' }> & { key: string }) | null>(null)
  const key = `${id}:${attempt}`
  // Your other playlists, for the "same name" hint.
  const [others, setOthers] = useState<PlaylistSummary[]>([])
  const [busy, setBusy] = useState<'create' | 'copy' | 'delete' | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const deleteDialog = useRef<HTMLDialogElement>(null)
  const cards = useDownloadCards()

  useEffect(() => {
    const ctrl = new AbortController()
    getPlaylist(id, ctrl.signal)
      .then(playlist => setFetched({ key, status: 'ready', playlist }))
      .catch(err => {
        if (ctrl.signal.aborted) return
        setFetched(err instanceof ApiError && err.status === 404 ? { key, status: 'notFound' } : { key, status: 'error', problem: providerMessage(err) })
      })
    getPlaylists(ctrl.signal).then(setOthers, () => {})
    return () => ctrl.abort()
  }, [id, key])

  const load: Load = fetched && (fetched.key === key || (fetched.status === 'ready' && fetched.playlist.id === id))
    ? fetched : { status: 'loading' }
  const playlist = load.status === 'ready' ? load.playlist : null
  const title = playlist?.title ?? ''
  useEffect(() => {
    document.title = title ? `${title} - Naviseerr` : 'Naviseerr'
    return () => { document.title = 'Naviseerr' }
  }, [title])

  /** The change on screen at once; the server's answer only matters when it says no, and then the page reloads. */
  const edit = (local: Partial<PlaylistDetail>, save: () => Promise<void>) => {
    setFetched(f => f?.status === 'ready' ? { ...f, playlist: { ...f.playlist, ...local } } : f)
    setProblem(null)
    save().catch(() => { setProblem(SAVE_FAILED); retry() })
  }

  // Reordering (no library: Pointer Events do mouse, touch and pen in one path, which HTML drag and drop does
  // not on phones). The row moves while you drag; one save when you let go.
  const list = useRef<HTMLUListElement>(null)
  const [dragging, setDragging] = useState<{ id: string; before: CollectionTrack[] } | null>(null)
  const reorder = (tracks: CollectionTrack[]) => tracks.map((t, i) => ({ ...t, position: i + 1 }))
  const saveOrder = (tracks: CollectionTrack[]) => edit({ tracks: reorder(tracks) }, () => reorderPlaylist(id, tracks.map(t => t.id)))
  const showOrder = (tracks: CollectionTrack[]) =>
    setFetched(f => f?.status === 'ready' ? { ...f, playlist: { ...f.playlist, tracks: reorder(tracks) } } : f)

  const dragMove = (clientY: number) => {
    if (!dragging || !playlist || !list.current) return
    const from = playlist.tracks.findIndex(t => t.id === dragging.id)
    const mids = Array.from(list.current.children, row => { const r = row.getBoundingClientRect(); return r.top + r.height / 2 })
    const to = dropIndex(clientY, mids, from)
    if (to !== from) showOrder(moveItem(playlist.tracks, from, to))
    // Near the window's edge the page scrolls, so a long list can be crossed in one drag.
    if (clientY < 80) window.scrollBy(0, -12)
    else if (clientY > window.innerHeight - 80) window.scrollBy(0, 12)
  }

  const dragEnd = () => {
    if (!dragging || !playlist) return
    const moved = playlist.tracks.some((t, i) => t.id !== dragging.before[i]?.id)
    setDragging(null)
    if (!moved) return
    const position = playlist.tracks.findIndex(t => t.id === dragging.id) + 1
    saveOrder(playlist.tracks)
    setAnnouncement(`Moved ${playlist.tracks[position - 1].name} to position ${position} of ${playlist.tracks.length}`)
  }

  /** ArrowUp / ArrowDown on the grip moves the song one place; focus stays on it (rows are keyed by song). */
  const keyMove = (e: KeyboardEvent, index: number) => {
    if (!playlist || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return
    e.preventDefault()
    const to = index + (e.key === 'ArrowUp' ? -1 : 1)
    if (to < 0 || to >= playlist.tracks.length) return
    const tracks = moveItem(playlist.tracks, index, to)
    saveOrder(tracks)
    setAnnouncement(`Moved ${tracks[to].name} to position ${to + 1} of ${tracks.length}`)
  }

  const remove = (videoId: string, name: string) => {
    if (!playlist) return
    const tracks = playlist.tracks.filter(t => t.id !== videoId).map((t, i) => ({ ...t, position: i + 1 }))
    edit({ tracks, trackCount: tracks.length }, () => removeFromPlaylist(id, videoId))
    setAnnouncement(`Removed ${name}`)
  }

  const create = async () => {
    if (!playlist) return
    setBusy('create')
    const mosaic = mosaicOf(playlist.tracks.map(t => t.iconURL))
    const outcome = await onDownload(id, 'CUSTOM', {
      youtubeId: id,
      downloadType: 'CUSTOM',
      title: playlist.title,
      artistNames: [],
      albumName: null,
      iconURL: playlist.coverUrl ?? mosaic[0] ?? null,
    })
    setBusy(null)
    setAnnouncement(outcome.status === 'accepted' ? `Creating ${playlist.title}`
      : outcome.status === 'exists' ? alreadyCopy(outcome.existing, playlist.title)
      : `Couldn't create ${playlist.title}`)
    if (outcome.status === 'failed') setProblem("Couldn't create this — try again")
    else retry()
  }

  const duplicate = async () => {
    setBusy('copy')
    try {
      const copy = await copyPlaylist(id)
      navigate(`/library/${encodeURIComponent(copy.id)}`)
    } catch {
      setProblem("Couldn't duplicate this — try again")
    }
    setBusy(null)
  }

  const confirmDelete = async () => {
    setBusy('delete')
    try {
      await deletePlaylist(id)
      deleteDialog.current?.close()
      navigate('/library', { replace: true })
    } catch {
      deleteDialog.current?.close()
      setProblem("Couldn't delete this — try again")
      setBusy(null)
    }
  }

  const draft = playlist !== null && playlist.downloadedAt === null
  const feedLabel = itemDownloadLabel(itemDownload(cards, 'CUSTOM', id))
  const createLabel = feedLabel ?? (busy === 'create' ? 'Creating…' : playlist?.downloadedAt ? 'Created' : 'Create')
  // Inert, not disabled, so focus stays on it; once created a click opens Downloads.
  const createInert = !playlist || playlist.tracks.length === 0 || busy === 'create' || !draft || feedLabel !== null
  const total = playlist ? playlist.tracks.reduce((s, t) => s + (t.durationSeconds ?? 0), 0) : 0
  const meta = playlist ? [playlistMeta(playlist), total ? `${Math.round(total / 60)} min` : ''].filter(Boolean).join(' · ') : ''

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
      <AppHeader action={
        <PageNavButton label="Your playlists" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/library')} />
      } />

      <main>
        {load.status === 'notFound' && (
          <p role="status" className="py-12 text-center text-zinc-400">
            This playlist doesn't exist any more. <Link to="/library" className="underline hover:text-white">Your playlists</Link>
          </p>
        )}
        {load.status === 'error' && (
          <div className="py-12 text-center text-zinc-400">
            <p role="status">
              Couldn't load this playlist.
              {load.problem && <span className="block mt-1 text-sm">{load.problem}</span>}
            </p>
            <button type="button" onClick={retry} className="mt-3 rounded-full border border-zinc-700 px-4 h-9 text-sm text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">
              Try again
            </button>
          </div>
        )}

        {(load.status === 'loading' || playlist) && (
          <div className="flex flex-col sm:flex-row gap-6" aria-busy={load.status === 'loading'}>
            {playlist ? (
              <PlaylistCover coverUrl={playlist.coverUrl} mosaic={mosaicOf(playlist.tracks.map(t => t.iconURL))} className="h-40 w-40 sm:h-48 sm:w-48 flex-shrink-0" />
            ) : (
              <div className="h-40 w-40 sm:h-48 sm:w-48 flex-shrink-0 rounded-md bg-zinc-800 animate-pulse motion-reduce:animate-none" />
            )}
            <div className="min-w-0 flex-1 flex flex-col gap-2">
              <TypeBadge type="CUSTOM" className="self-start" />
              {playlist && draft && (
                <>
                  <h2 className="sr-only">{playlist.title}</h2>
                  <InPlaceText
                    value={playlist.title}
                    label="Playlist name"
                    maxLength={TITLE_MAX}
                    required
                    className="-mx-1 px-1 text-3xl font-bold"
                    onSave={text => edit({ title: text }, () => updatePlaylist(id, { title: text }))}
                  />
                  {titleClash(playlist.title, id, others) && (
                    <p className="text-xs text-amber-400">Another of your playlists is called this; creating both makes one playlist file in your music app.</p>
                  )}
                  <InPlaceText
                    value={playlist.description}
                    label="Description"
                    placeholder="Add a description"
                    maxLength={DESCRIPTION_MAX}
                    className="-mx-1 px-1 text-sm text-zinc-300"
                    onSave={text => edit({ description: text }, () => updatePlaylist(id, { description: text }))}
                  />
                </>
              )}
              {playlist && !draft && (
                <>
                  <h2 className="text-3xl font-bold line-clamp-2">{playlist.title}</h2>
                  {playlist.description && <p className="text-sm text-zinc-300">{playlist.description}</p>}
                </>
              )}
              {!playlist && <div className="h-9 w-64 max-w-full rounded bg-zinc-800/60 animate-pulse motion-reduce:animate-none" />}
              <p className="text-sm text-zinc-400">{meta}</p>
              {playlist?.downloadedAt && (
                <p className="text-xs text-zinc-500">Created on {shortDate(new Date(playlist.downloadedAt))}. Duplicate it to make changes.</p>
              )}

              <div className="mt-auto flex flex-col items-start gap-1.5">
                <div className="flex flex-wrap items-start gap-2">
                  <button
                    type="button"
                    onClick={() => { if (feedLabel || (playlist?.downloadedAt && busy !== 'create')) navigate('/downloads'); else if (!createInert) void create() }}
                    aria-disabled={createInert}
                    title={feedLabel ? `${feedLabel} - open Downloads` : undefined}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 aria-disabled:bg-zinc-700 aria-disabled:hover:bg-zinc-700 aria-disabled:text-zinc-300 aria-disabled:cursor-default rounded-full h-10 px-5 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {(createLabel === 'Downloading…' || createLabel === 'Creating…') && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                    {(createLabel === 'Downloaded' || createLabel === 'Partly downloaded' || createLabel === 'Created') && <Check className="w-4 h-4" aria-hidden="true" />}
                    {createLabel}
                  </button>
                  <button type="button" onClick={() => void duplicate()} aria-disabled={!playlist || busy === 'copy'} className={OUTLINE}>
                    {busy === 'copy' ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                    Duplicate
                  </button>
                  {playlist && playlist.tracks.length > 0 && (
                    <AddToPlaylistButton header target={{ type: 'CUSTOM', id, title: playlist.title, songs: playlist.tracks.map(t => ({ id: t.id, name: t.name })) }} />
                  )}
                  {draft && (
                    <button type="button" onClick={() => deleteDialog.current?.showModal()} className={OUTLINE}>
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                      Delete
                    </button>
                  )}
                </div>
                {draft && <p className="text-xs text-zinc-500">Downloads the songs and adds the playlist to your music app.</p>}
                {problem && <p role="status" className="text-xs text-red-400">{problem}</p>}
              </div>
            </div>
          </div>
        )}

        {playlist && (
          <div className="mt-8">
            {playlist.tracks.length === 0 ? (
              <p className="py-8 text-center text-zinc-400">
                No songs yet. <Link to="/" className="underline hover:text-white">Find songs to add</Link>, then press Add to playlist on any song, album or playlist.
              </p>
            ) : (
              <ul ref={list} className="space-y-0.5">
                {playlist.tracks.map((track, index) => (
                  <li
                    key={track.id}
                    className={`h-16 sm:h-14 flex items-center gap-3 rounded-md px-2 hover:bg-white/10 ${dragging?.id === track.id ? 'bg-zinc-800 shadow-lg ring-1 ring-green-600' : ''}`}
                  >
                    {draft && (
                      <button
                        type="button"
                        aria-label={`Move ${track.name}`}
                        aria-describedby="reorder-help"
                        title="Drag to move, or use the arrow keys"
                        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setDragging({ id: track.id, before: playlist.tracks }) }}
                        onPointerMove={e => dragMove(e.clientY)}
                        onPointerUp={dragEnd}
                        onPointerCancel={() => { if (dragging) showOrder(dragging.before); setDragging(null) }}
                        onKeyDown={e => keyMove(e, index)}
                        className={`-ml-1 inline-flex h-10 w-8 sm:h-8 sm:w-6 flex-none touch-none select-none items-center justify-center rounded text-zinc-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                      >
                        <GripVertical className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                    {track.iconURL ? (
                      <img src={track.iconURL} alt="" referrerPolicy="no-referrer" className="h-10 w-10 rounded object-cover bg-zinc-800" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-zinc-800" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-base sm:text-sm font-medium text-white truncate">{track.name}</p>
                      <p className="text-sm sm:text-xs text-zinc-400 truncate"><ArtistNames names={track.artists} ids={track.artistIds} /></p>
                    </div>
                    <span className="hidden sm:inline w-12 text-right text-xs text-zinc-400 tabular-nums">
                      {track.durationSeconds != null && formatDuration(track.durationSeconds)}
                    </span>
                    <PlayOnYouTubeMusic videoId={track.id} title={track.name} artists={track.artists} />
                    <button type="button" onClick={() => onInfo(track.id, track.plays)} aria-label={`Details for ${track.name}`} className={ICON_BUTTON}>
                      <Info className="w-4 h-4" aria-hidden="true" />
                    </button>
                    {draft && (
                      <button type="button" onClick={() => remove(track.id, track.name)} aria-label={`Remove ${track.name}`} title="Remove from this playlist" className={ICON_BUTTON}>
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p id="reorder-help" className="sr-only">Drag to move the song, or press the up and down arrow keys.</p>
        <p role="status" className="sr-only">{announcement}</p>
      </main>

      {/* The app's own question, not window.confirm: a browser may silence that inside a frame (Feishin). */}
      <dialog
        ref={deleteDialog}
        aria-labelledby="delete-playlist-title"
        className="w-[min(100vw-2rem,24rem)] bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-white backdrop:bg-black/70"
      >
        <h2 id="delete-playlist-title" className="text-lg font-bold">Delete {title}?</h2>
        <p className="mt-2 text-sm text-zinc-400">It is only a draft, so nothing was downloaded and nothing else changes.</p>
        <form method="dialog" className="mt-6 flex justify-end gap-2">
          <button value="cancel" className={OUTLINE}>Cancel</button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            aria-disabled={busy === 'delete'}
            className="inline-flex items-center gap-2 rounded-full bg-red-600 hover:bg-red-500 h-10 px-5 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {busy === 'delete' && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            Delete
          </button>
        </form>
      </dialog>
    </div>
  )
}
