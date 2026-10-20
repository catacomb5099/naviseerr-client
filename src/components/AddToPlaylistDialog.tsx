import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Loader2, Plus, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { addToPlaylist, createPlaylist, getPlaylists } from '../api/endpoints'
import { PlaylistSummary } from '../api/types'
import { AddTarget } from '../hooks/useAddToPlaylist'
import { TITLE_MAX, addedCopy } from '../lib/playlists'
import { serverMessage } from '../lib/utils'
import { PlaylistCover } from './PlaylistCover'

const ROW = 'w-full flex items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-white/10 aria-disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'

interface AddToPlaylistDialogProps {
  target: AddTarget
  onClose: () => void
  /** What to say once it is in, and which playlist to link to. */
  onAdded: (message: string, playlistId: string) => void
}

/**
 * "Add to playlist" (YouTube Music's "Save to playlist"; Spotify and Apple Music show the same list): a new
 * playlist on top, then your drafts, last edited first. Created playlists are not offered, since they cannot
 * change. For an album or playlist, "Choose songs" lets you untick some. App mounts one per opening.
 */
export function AddToPlaylistDialog({ target, onClose, onAdded }: AddToPlaylistDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [playlists, setPlaylists] = useState<PlaylistSummary[] | null>(null)
  const [name, setName] = useState('')
  const [choosing, setChoosing] = useState(false)
  const [unticked, setUnticked] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ref.current?.showModal()
    const ctrl = new AbortController()
    getPlaylists(ctrl.signal).then(setPlaylists, err => { if (!ctrl.signal.aborted) setError(serverMessage(err)) })
    return () => ctrl.abort()
  }, [])

  // A playlist is not offered as a place for itself.
  const drafts = (playlists ?? []).filter(p => p.downloadedAt === null && !(target.type === 'CUSTOM' && p.id === target.id))
  const songs = target.songs ?? []
  const chosen = songs.filter(s => !unticked.has(s.id))
  const nothingChosen = choosing && chosen.length === 0

  const add = async (playlist: { id: string; title: string } | 'new') => {
    if (busy || nothingChosen) return
    setBusy(playlist === 'new' ? 'new' : playlist.id)
    setError(null)
    try {
      const into = playlist === 'new' ? await createPlaylist(name.trim() || undefined) : playlist
      const result = await addToPlaylist(into.id, {
        type: target.type,
        id: target.id,
        songIds: choosing ? chosen.map(s => s.id) : undefined,
      })
      onAdded(addedCopy(result, target.type === 'SONG' ? target.title : null, into.title), into.id)
      onClose()
    } catch (err) {
      setError(serverMessage(err))
      setBusy(null)
    }
  }

  const toggle = (id: string) => setUnticked(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      aria-labelledby="add-to-playlist-title"
      className="w-[min(100vw-2rem,28rem)] bg-zinc-900 border border-zinc-800 rounded-xl p-0 text-white backdrop:bg-black/70"
    >
      <div className="relative max-h-[85vh] overflow-y-auto overscroll-contain p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 h-10 w-10 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
        <h2 id="add-to-playlist-title" className="text-lg font-bold pr-8">Add to playlist</h2>
        <p className="text-sm text-zinc-400 truncate pr-8">{target.title}</p>

        <form
          className="mt-4 flex items-center gap-2"
          onSubmit={e => { e.preventDefault(); void add('new') }}
        >
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={TITLE_MAX}
            aria-label="New playlist name"
            placeholder={`My playlist #${(playlists?.length ?? 0) + 1}`}
            className="min-w-0 flex-1 h-10 rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          />
          <button
            type="submit"
            aria-disabled={busy !== null || nothingChosen}
            className="inline-flex flex-none items-center gap-1.5 rounded-full bg-green-600 hover:bg-green-500 aria-disabled:bg-zinc-700 aria-disabled:cursor-default h-10 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {busy === 'new' ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
            New playlist
          </button>
        </form>

        <ul className="mt-4 space-y-0.5" aria-busy={playlists === null}>
          {playlists === null && !error && Array.from({ length: 2 }, (_, i) => (
            <li key={i} className="h-14 rounded-md bg-zinc-800/60 animate-pulse motion-reduce:animate-none" />
          ))}
          {drafts.map(p => (
            <li key={p.id}>
              <button type="button" onClick={() => void add(p)} aria-disabled={busy !== null || nothingChosen} className={ROW}>
                <PlaylistCover coverUrl={p.coverUrl} mosaic={p.mosaic} className="h-10 w-10 flex-none" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium truncate">{p.title}</span>
                  <span className="block text-xs text-zinc-400">{p.trackCount} {p.trackCount === 1 ? 'song' : 'songs'}</span>
                </span>
                {busy === p.id && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none text-zinc-400" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
        {playlists !== null && drafts.length === 0 && (
          <p className="mt-2 text-sm text-zinc-500">Name a new playlist above. Playlists you have created stay as they are and are not listed.</p>
        )}

        {songs.length > 1 && (
          <div className="mt-4 border-t border-zinc-800 pt-3">
            <button
              type="button"
              onClick={() => setChoosing(c => !c)}
              aria-expanded={choosing}
              className="inline-flex items-center gap-1 rounded text-sm text-zinc-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              <ChevronDown className={`w-4 h-4 transition-transform motion-reduce:transition-none ${choosing ? 'rotate-180' : ''}`} aria-hidden="true" />
              {choosing ? `Choose songs: ${chosen.length} of ${songs.length}` : `Choose songs (all ${songs.length})`}
            </button>
            {choosing && (
              <ul className="mt-2 max-h-60 overflow-y-auto space-y-0.5">
                {songs.map(s => (
                  <li key={s.id}>
                    <label className="flex items-center gap-3 rounded px-2 py-1.5 text-sm hover:bg-white/5">
                      <input type="checkbox" checked={!unticked.has(s.id)} onChange={() => toggle(s.id)} className="h-4 w-4 accent-green-600" />
                      <span className="truncate">{s.name}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {error && <p role="status" className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
    </dialog>
  )
}

/** The line that says what was added, with a link to the playlist; gone after a few seconds. */
export function AddedNote({ message, playlistId, onDone }: { message: string; playlistId: string; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 6000)
    return () => window.clearTimeout(t)
  }, [onDone])
  return (
    <div role="status" className="fixed bottom-20 sm:bottom-6 left-1/2 z-50 -translate-x-1/2 max-w-[calc(100vw-2rem)] flex items-center gap-3 rounded-full bg-zinc-100 px-4 py-2 text-sm text-zinc-900 shadow-lg">
      <span className="truncate">{message}</span>
      <Link to={`/library/${encodeURIComponent(playlistId)}`} onClick={onDone} className="font-semibold underline flex-none">Open</Link>
    </div>
  )
}
