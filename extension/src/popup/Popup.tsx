import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { DownloadCard } from '../../../src/components/DownloadCard'
import { DownloadRow } from '../../../src/components/DownloadRow'
import { DownloadFilter, DownloadFilterPills } from '../../../src/components/DownloadFilterPills'
import { useActiveDownloads } from '../../../src/hooks/useActiveDownloads'
import { useAllDownloads } from '../../../src/hooks/useAllDownloads'
import { useDismissSound } from '../../../src/hooks/useDismissSound'
import { pageItems } from '../../../src/lib/downloadLibrary'
import { DownloadCardState } from '../../../src/lib/downloadPanel'
import { saveServerUrl } from '../settings'

type Tab = 'now' | 'all'

/** The web app's rows link to its own album, playlist and artist pages, which the extension does not
 *  have; the same things live on YouTube Music, so a click there opens it in a new tab instead. */
const YOUTUBE_MUSIC: [RegExp, (id: string) => string][] = [
  [/^\/album\/(.+)$/, id => `https://music.youtube.com/browse/${id}`],
  [/^\/playlist\/(.+)$/, id => `https://music.youtube.com/playlist?list=${id}`],
  [/^\/artist\/(.+)$/, id => `https://music.youtube.com/channel/${id}`],
]

function YouTubeLinks() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (pathname === '/') return
    for (const [pattern, url] of YOUTUBE_MUSIC) {
      const match = pathname.match(pattern)
      if (match) void chrome.tabs.create({ url: url(match[1]) })
    }
    navigate('/', { replace: true })
  }, [pathname, navigate])
  return null
}

interface Props {
  serverUrl: string
}

/** The extension's window: what is downloading now (the web app's panel) and every download so far
 *  (its Downloads page, where finished downloads stay and albums and playlists open into songs). */
export function Popup({ serverUrl }: Props) {
  const [tab, setTab] = useState<Tab>('now')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [reachable, setReachable] = useState<boolean | null>(null)
  const { muted, toggleMuted, playSwoosh } = useDismissSound()
  const downloads = useActiveDownloads(playSwoosh)

  // One look at the server on open, so "nothing downloading" and "server not answering" read differently.
  useEffect(() => {
    fetch(`${serverUrl}/downloads/active`).then(r => setReachable(r.ok), () => setReachable(false))
  }, [serverUrl])

  return (
    <div className="w-[480px] min-h-[320px] max-h-[580px] flex flex-col bg-black text-white">
      <YouTubeLinks />
      <header className="flex items-center gap-2 px-4 pt-3 pb-2">
        <h1 className="text-lg font-bold flex-1">
          <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Naviseerr</span>
        </h1>
        <span
          className={`w-2 h-2 rounded-full ${reachable === null ? 'bg-zinc-600' : reachable ? 'bg-green-500' : 'bg-red-500'}`}
          title={reachable ? `Connected to ${serverUrl}` : `Not connected to ${serverUrl}`}
        />
        <button
          type="button"
          aria-label="Server address"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen(o => !o)}
          className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
        </button>
      </header>

      {settingsOpen && <ServerSettings serverUrl={serverUrl} />}

      <div role="tablist" className="flex gap-1 px-4 border-b border-zinc-800">
        <TabButton active={tab === 'now'} onClick={() => setTab('now')}>
          Downloading{downloads.cards.length > 0 && <span className="ml-1.5 text-[11px] bg-zinc-800 rounded-full px-2 py-0.5">{downloads.cards.length}</span>}
        </TabButton>
        <TabButton active={tab === 'all'} onClick={() => setTab('all')}>All downloads</TabButton>
        <span className="flex-1" />
        {tab === 'now' && (
          <button type="button" onClick={toggleMuted} className="text-xs text-zinc-500 hover:text-white">
            {muted ? 'Sounds off' : 'Sounds on'}
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {tab === 'now'
          ? <NowView downloads={downloads} reachable={reachable} serverUrl={serverUrl} />
          : <AllView downloads={downloads} />}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center px-2 py-2 text-sm -mb-px border-b-2 ${active ? 'border-green-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}
    >
      {children}
    </button>
  )
}

function ServerSettings({ serverUrl }: { serverUrl: string }) {
  const [value, setValue] = useState(serverUrl)
  const [failed, setFailed] = useState(false)
  return (
    <form
      className="mx-4 mb-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2"
      onSubmit={async e => {
        e.preventDefault()
        if (await saveServerUrl(value)) location.reload()
        else setFailed(true)
      }}
    >
      <label className="block text-xs text-zinc-400" htmlFor="server-url">Naviseerr server address</label>
      <div className="flex gap-2">
        <input
          id="server-url"
          value={value}
          onChange={e => { setValue(e.target.value); setFailed(false) }}
          placeholder="http://localhost:8080"
          className="flex-1 h-8 px-2 rounded bg-black border border-zinc-700 text-sm"
        />
        <button type="submit" className="h-8 px-3 rounded bg-green-600 hover:bg-green-700 text-sm font-medium">Save</button>
      </div>
      {failed && <p className="text-xs text-red-400">That is not a web address, or Chrome was not allowed to reach it.</p>}
    </form>
  )
}

type Downloads = ReturnType<typeof useActiveDownloads>

function NowView({ downloads, reachable, serverUrl }: { downloads: Downloads; reachable: boolean | null; serverUrl: string }) {
  const { cards, exiting, pollIntervalMs, dismiss, cancel, retry, inFlight } = downloads
  if (cards.length === 0) {
    return (
      <p className="px-8 py-16 text-center text-sm text-zinc-400">
        {reachable === false
          ? <>Naviseerr is not answering at <span className="text-white">{serverUrl}</span>. Check it is running, or change the address with the gear above.</>
          : <>Nothing downloading. On YouTube Music, press the <span className="text-green-500">download arrow</span> on a song, album or playlist.</>}
      </p>
    )
  }
  return (
    <div className="flex flex-col p-2">
      {cards.map(card => (
        <DownloadCard
          key={card.downloadId}
          card={card}
          exiting={exiting.has(card.downloadId)}
          pollIntervalMs={pollIntervalMs}
          onDismiss={() => dismiss(card.downloadId)}
          onCancel={() => cancel(card.downloadId)}
          onRetry={() => retry(card.downloadId)}
          inFlight={inFlight.has(card.downloadId)}
        />
      ))}
    </div>
  )
}

const PAGE_SIZE = 20

function AllView({ downloads }: { downloads: Downloads }) {
  const [filter, setFilter] = useState<DownloadFilter>('all')
  const [page, setPage] = useState(1)
  const { cards, pollIntervalMs, cancel, retry, inFlight } = downloads
  // A download that starts or finishes while this is open refetches the page, as on the web app.
  const liveIds = cards.map((card: DownloadCardState) => card.downloadId).sort().join(',')
  const type = filter === 'all' ? undefined : filter
  const { rows, totalPages, loaded, error, refresh } = useAllDownloads(page, { pageSize: PAGE_SIZE, type, refreshKey: liveIds })
  const items = pageItems(rows, {}, cards)

  return (
    <div className="px-3 pt-3">
      <DownloadFilterPills selected={filter} onSelect={next => { setFilter(next); setPage(1) }} />
      {error ? (
        <p className="py-12 text-center text-sm text-red-400">
          Couldn&apos;t load downloads. <button type="button" className="underline" onClick={refresh}>Try again</button>
        </p>
      ) : !loaded ? (
        <p className="py-12 text-center text-sm text-zinc-500">Loading downloads…</p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">Nothing downloaded yet</p>
      ) : (
        <div className="divide-y divide-zinc-800">
          {items.map(item => (
            <DownloadRow
              key={item.downloadId}
              item={item}
              pollIntervalMs={pollIntervalMs}
              onCancel={cancel}
              onRetry={retry}
              inFlight={inFlight}
              songDetails
            />
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-3 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-zinc-700 disabled:opacity-40">Previous</button>
          <span className="text-zinc-400">Page {page} of {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-zinc-700 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  )
}
