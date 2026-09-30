import { useEffect, useState } from 'react'
import { ArrowDownToLine, ArrowLeft, Check, Info, Loader2, Sparkles } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getSuggestedPlaylist } from '../api/endpoints'
import { ApiError } from '../api/client'
import { DownloadType, SuggestedPlaylist, SuggestedTrack } from '../api/types'
import { DownloadMetaInput } from '../lib/downloadLibrary'
import { categoryName, editionDateLong, filtersCopy, tierCopy } from '../lib/suggested'
import { formatPlays } from '../lib/utils'
import { useSuggestedRefresh } from '../hooks/useSuggestedRefresh'
import { useRetry } from '../hooks/useRetry'
import { AppHeader } from '../components/AppHeader'
import { PageNavButton } from '../components/PageNavButton'
import { SuggestedPlaylistCover } from '../components/SuggestedPlaylistCover'
import { SuggestedRefreshPanel } from '../components/SuggestedRefreshPanel'
import { REQUEST_FAILED_COPY, RequestState } from './CollectionPage'

interface SuggestedPlaylistPageProps {
  /** Same plumbing as the collection page: App requests the download and records its metadata. */
  onDownload: (id: string, type: DownloadType, meta: DownloadMetaInput) => Promise<boolean>
  /** Opens the song info pop-up App owns. */
  onInfo: (videoId: string, plays?: string | null) => void
}

type Load =
  | { status: 'error' }
  /** The curator has not built this category yet (server 404). */
  | { status: 'notBuilt' }
  /** This server has no curator at all (server 503). */
  | { status: 'off' }
  | { status: 'ready'; playlist: SuggestedPlaylist }

const PULSE = 'bg-zinc-800/60 animate-pulse motion-reduce:animate-none'
const BUTTON = 'rounded-full border border-zinc-700 px-4 h-9 text-sm text-white hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'
const ICON_BUTTON = 'inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500'

/** "Cocteau Twins · Blue Bell Knoll (1988)" - who and where from, on one line. */
function trackLine(track: SuggestedTrack): string {
  const who = track.artists.length > 0 ? track.artists.join(', ') : 'Unknown Artist'
  if (!track.album) return who
  return `${who} · ${track.album}${track.albumYear ? ` (${track.albumYear})` : ''}`
}

/**
 * One suggested playlist as its own page: the generated cover, when this edition was built, and every
 * song with the curator's reason for picking it. Everything comes from the URL and one fetch, so a deep
 * link or a refresh works. Songs download one by one for now; each is an ordinary YouTube id.
 */
export function SuggestedPlaylistPage({ onDownload, onInfo }: SuggestedPlaylistPageProps) {
  const { category = '' } = useParams()
  const navigate = useNavigate()
  // 'default' is the router's key for an entry with no history behind it (a typed address, a fresh tab).
  // Anything else was reached from inside the app, so the browser's back is the right way out.
  const cameFromApp = useLocation().key !== 'default'
  // Keyed by what was fetched: a result for another category (or an earlier attempt) is not ours yet.
  const [fetched, setFetched] = useState<(Load & { key: string }) | null>(null)
  const [attempt, retry] = useRetry(category)
  // Forgotten on leaving the page - the downloads panel is the record of what queued.
  const [requests, setRequests] = useState<Record<string, RequestState>>({})
  const [announcement, setAnnouncement] = useState('')
  // Owned here, not by the panel, so a run's outcome survives the re-fetch it triggers.
  const refresh = useSuggestedRefresh(retry)

  const key = `${category}:${attempt}`
  useEffect(() => {
    let cancelled = false
    getSuggestedPlaylist(category, { fresh: attempt > 0 })
      .then(playlist => { if (!cancelled) setFetched({ key, status: 'ready', playlist }) })
      .catch(err => {
        if (cancelled) return
        const status = err instanceof ApiError ? err.status : 0
        setFetched({ key, status: status === 404 ? 'notBuilt' : status === 503 ? 'off' : 'error' })
      })
    return () => { cancelled = true }
  }, [category, key, attempt])

  const load: Load | { status: 'loading' } = fetched?.key === key ? fetched : { status: 'loading' }
  const playlist = load.status === 'ready' ? load.playlist : null
  // Before the edition exists the page is still about a category; its key reads well enough as a title.
  const title = playlist?.title ?? (load.status === 'loading' ? '' : categoryName(category))
  useEffect(() => {
    document.title = title ? `${title} - Naviseerr` : 'Naviseerr'
    return () => { document.title = 'Naviseerr' }
  }, [title])

  const meta: string[] = []
  if (playlist) {
    const filters = filtersCopy(playlist.filters)
    if (filters) meta.push(filters)
    meta.push(`Edition of ${editionDateLong(playlist.editionDate)}`)
    meta.push(`${playlist.trackCount} songs`)
  }

  const send = async (id: string, type: DownloadType, name: string, meta: DownloadMetaInput) => {
    setRequests(prev => ({ ...prev, [id]: 'pending' }))
    const accepted = await onDownload(id, type, meta)
    setRequests(prev => ({ ...prev, [id]: accepted ? 'sent' : 'failed' }))
    setAnnouncement(accepted ? `Requested ${name}` : `Couldn't request ${name}`)
  }

  const downloadTrack = (track: SuggestedTrack) => send(track.id, 'SONG', track.name, {
    youtubeId: track.id,
    downloadType: 'SONG',
    title: track.name,
    artistNames: track.artists,
    albumName: track.album,
    iconURL: track.iconURL || null,
  })

  // The whole edition as ONE download, keyed by the category: the server fetches the same edition
  // from the curator at admission and files it like a playlist. The card borrows the first song's art.
  const downloadAll = () => playlist && send(playlist.category, 'CURATED', playlist.title, {
    youtubeId: playlist.category,
    downloadType: 'CURATED',
    title: playlist.title,
    artistNames: ['Naviseerr'],
    albumName: null,
    iconURL: playlist.tracks[0]?.iconURL ?? null,
  })

  const allState = requests[category]
  // Inert (not `disabled`) while it cannot be pressed, so a keyboard user's focus stays on it.
  const allInert = !playlist || playlist.tracks.length === 0 || allState === 'pending' || allState === 'sent'

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
      <AppHeader action={
        <PageNavButton
          label="Back"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => cameFromApp ? navigate(-1) : navigate('/')}
        />
      } />

      <main>
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-6" aria-busy={load.status === 'loading'}>
          {playlist ? (
            <SuggestedPlaylistCover category={playlist.category} title={playlist.title} className="h-40 w-40 sm:h-48 sm:w-48 flex-shrink-0" />
          ) : (
            <div className={`h-40 w-40 sm:h-48 sm:w-48 flex-shrink-0 rounded-md bg-zinc-800 shadow-lg ${load.status === 'loading' ? PULSE : ''}`} />
          )}
          <div className="min-w-0 flex flex-col gap-2">
            <span className="self-start inline-flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
              <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
              Made for you
            </span>
            {playlist ? (
              <>
                <h2 className="text-3xl font-bold line-clamp-2">{playlist.title}</h2>
                <p className="text-sm text-zinc-400">{meta.join(' · ')}</p>
                <p className="text-xs text-zinc-500 max-w-prose">
                  A new edition replaces this one every week. Download the songs you like before it goes.
                </p>
                <div className="mt-auto pt-2 flex flex-col items-start gap-1.5">
                  <button
                    type="button"
                    onClick={() => { if (!allInert) void downloadAll() }}
                    aria-disabled={allInert}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 aria-disabled:bg-zinc-700 aria-disabled:hover:bg-zinc-700 aria-disabled:text-zinc-300 aria-disabled:cursor-default rounded-full h-10 px-5 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {allState === 'sent' && <Check className="w-4 h-4" aria-hidden="true" />}
                    {allState === 'pending' && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                    {allState === 'sent' ? 'Requested' : allState === 'pending' ? 'Requesting…' : 'Download all'}
                  </button>
                  {allState === 'failed' && <p className="text-xs text-red-400">{REQUEST_FAILED_COPY}</p>}
                </div>
              </>
            ) : load.status === 'loading' ? (
              <>
                <div className={`h-9 w-64 max-w-full rounded ${PULSE}`} />
                <div className={`h-5 w-40 rounded ${PULSE}`} />
              </>
            ) : (
              <h2 className="text-3xl font-bold line-clamp-2">{title}</h2>
            )}
          </div>
        </div>

        {/* Songs */}
        <div className="mt-8" aria-busy={load.status === 'loading'}>
          {load.status === 'loading' && (
            <ul aria-label="Loading songs" className="space-y-1">
              {Array.from({ length: 8 }, (_, i) => (
                <li key={i} className={`h-14 rounded-md ${PULSE}`} />
              ))}
            </ul>
          )}
          {load.status === 'notBuilt' && (
            <div className="py-8 max-w-prose">
              <SuggestedRefreshPanel
                message="This playlist hasn't been built yet. Playlists are made once a week."
                refresh={refresh}
              />
            </div>
          )}
          {load.status === 'off' && (
            <div className="py-8 text-center text-zinc-400">
              <p role="status">Suggested playlists aren't set up on this server.</p>
            </div>
          )}
          {load.status === 'error' && (
            <div className="py-8 text-center text-zinc-400">
              <p role="status">Couldn't load this playlist.</p>
              <button type="button" onClick={retry} className={`mt-3 ${BUTTON}`}>Try again</button>
            </div>
          )}
          {playlist && playlist.tracks.length === 0 && (
            <p role="status" className="py-8 text-center text-zinc-400">No songs in this edition.</p>
          )}
          {playlist && playlist.tracks.length > 0 && (
            <ul className="space-y-0.5">
              {playlist.tracks.map(track => {
                const state = requests[track.id]
                const inert = state === 'pending' || state === 'sent'
                const plays = formatPlays(track.popularity)
                return (
                  <li key={track.position} className="h-14 flex items-center gap-3 rounded-md px-2 hover:bg-white/10">
                    <span className="w-6 text-right text-sm text-zinc-500 tabular-nums">{track.position}</span>
                    {track.iconURL ? (
                      <img src={track.iconURL} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-10 w-10 rounded object-cover bg-zinc-800" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-zinc-800" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{track.name}</p>
                      {state === 'failed' ? (
                        <p className="text-xs text-red-400 truncate">{REQUEST_FAILED_COPY}</p>
                      ) : (
                        <p className="text-xs text-zinc-400 truncate">{trackLine(track)}</p>
                      )}
                    </div>
                    {plays && (
                      <span className="hidden sm:inline w-20 text-right text-xs text-zinc-400 tabular-nums whitespace-nowrap">
                        {plays}
                      </span>
                    )}
                    {/* Why this song: the curator's tier as a chip, its one-line reason as the tooltip and
                        for screen readers. Hidden on phones, where the row has no room for it. */}
                    <span
                      className="hidden sm:inline-flex flex-shrink-0 items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300"
                      title={track.reason ?? undefined}
                    >
                      {tierCopy(track.tier)}
                      {track.reason && <span className="sr-only">: {track.reason}</span>}
                    </span>
                    <button type="button" onClick={() => onInfo(track.id, plays)} aria-label={`Details for ${track.name}`} className={ICON_BUTTON}>
                      <Info className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (!inert) void downloadTrack(track) }}
                      aria-disabled={inert}
                      aria-label={state === 'sent' ? `Requested ${track.name}` : `Download ${track.name}`}
                      className={`${ICON_BUTTON} aria-disabled:hover:text-zinc-400 aria-disabled:cursor-default`}
                    >
                      {state === 'sent' ? (
                        <Check className="w-4 h-4 text-green-500" aria-hidden="true" />
                      ) : state === 'pending' ? (
                        <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none text-zinc-500" aria-hidden="true" />
                      ) : (
                        <ArrowDownToLine className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <p role="status" className="sr-only">{announcement}</p>
      </main>
    </div>
  )
}
