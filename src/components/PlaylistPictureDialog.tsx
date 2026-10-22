import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { removePlaylistCover, setPlaylistCover } from '../api/endpoints'
import { ACCEPT, makeCover } from '../lib/coverImage'
import { serverMessage } from '../lib/utils'
import { PlaylistCover } from './PlaylistCover'

const OUTLINE = 'inline-flex items-center gap-2 rounded-full border border-zinc-700 h-10 px-5 font-semibold text-white hover:bg-zinc-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
const GREEN = 'inline-flex items-center gap-2 rounded-full bg-green-600 hover:bg-green-500 aria-disabled:bg-zinc-700 h-10 px-5 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'

interface PlaylistPictureDialogProps {
  playlistId: string
  coverUrl: string | null
  mosaic: string[]
  onClose: () => void
  /** The picture's new address on the server, or null for the mosaic again. */
  onSaved: (coverUrl: string | null) => void
}

/**
 * Choose a picture for a draft (YouTube Music's upload with a preview; Spotify's "Choose photo"): the middle square
 * of the picture you pick is shown first, and Save keeps it. Remove picture goes back to the four-picture mosaic.
 */
export function PlaylistPictureDialog({ playlistId, coverUrl, mosaic, onClose, onSaved }: PlaylistPictureDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [chosen, setChosen] = useState<{ jpeg: Blob; url: string } | null>(null)
  const [busy, setBusy] = useState<'reading' | 'saving' | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const previewUrl = useRef<string | null>(null)

  useEffect(() => {
    ref.current?.showModal()
    return () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current) }
  }, [])

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy('reading')
    setProblem(null)
    const made = await makeCover(file)
    setBusy(null)
    if (typeof made === 'string') { setProblem(made); return }
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    previewUrl.current = URL.createObjectURL(made)
    setChosen({ jpeg: made, url: previewUrl.current })
  }

  const save = async (jpeg: Blob | null) => {
    setBusy('saving')
    setProblem(null)
    try {
      const saved = jpeg ? await setPlaylistCover(playlistId, jpeg) : await removePlaylistCover(playlistId)
      onSaved(saved.coverUrl)
      onClose()
    } catch (err) {
      setProblem(serverMessage(err))
      setBusy(null)
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      aria-labelledby="playlist-picture-title"
      className="w-[min(100vw-2rem,24rem)] bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-white backdrop:bg-black/70"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-3 right-3 h-10 w-10 sm:h-8 sm:w-8 inline-flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
      <h2 id="playlist-picture-title" className="text-lg font-bold">Playlist picture</h2>
      <div className="mt-4 mx-auto aspect-square w-full max-w-64">
        {chosen
          ? <img src={chosen.url} alt="Your new picture" className="h-full w-full rounded-md object-cover shadow-lg" />
          : <PlaylistCover coverUrl={coverUrl} mosaic={mosaic} className="h-full w-full" />}
      </div>
      <p className="mt-3 text-xs text-zinc-400">The middle square of your picture is used. JPEG, PNG or WebP, at least 300 × 300 pixels.</p>
      {problem && <p role="status" className="mt-2 text-sm text-red-400">{problem}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        {/* The label is the button, so the browser's own file picker opens (phones offer the camera roll). */}
        <label className={OUTLINE}>
          {busy === 'reading' ? <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ImagePlus className="w-4 h-4" aria-hidden="true" />}
          {chosen ? 'Choose another' : 'Choose picture'}
          <input type="file" accept={ACCEPT} className="sr-only" onChange={e => { void pick(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        {!chosen && coverUrl && (
          <button type="button" onClick={() => { if (!busy) void save(null) }} aria-disabled={busy !== null} className={OUTLINE}>Remove picture</button>
        )}
        {chosen && (
          <button type="button" onClick={() => { if (!busy) void save(chosen.jpeg) }} aria-disabled={busy !== null} className={GREEN}>
            {busy === 'saving' && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            Save
          </button>
        )}
      </div>
    </dialog>
  )
}
