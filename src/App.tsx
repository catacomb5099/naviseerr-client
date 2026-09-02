import { useState } from 'react'
import { HomePage } from './pages/HomePage'
import { DownloadsPage } from './pages/DownloadsPage'
import { DownloadPanel } from './components/DownloadPanel'
import { useActiveDownloads } from './hooks/useActiveDownloads'
import { useDownloadLibrary } from './hooks/useDownloadLibrary'
import { useDismissSound } from './hooks/useDismissSound'
import { DownloadMetaInput } from './lib/downloadLibrary'

type Page = 'home' | 'downloads'

function App() {
  const [page, setPage] = useState<Page>('home')
  const { muted, toggleMuted, playSwoosh } = useDismissSound()
  const {
    cards: downloadCards,
    exiting: exitingDownloadIds,
    pollIntervalMs,
    minimized: downloadsMinimized,
    setMinimized: setDownloadsMinimized,
    dismiss: dismissDownload,
    requestDownload,
  } = useActiveDownloads(playSwoosh)
  const library = useDownloadLibrary(downloadCards)

  const handleDownload = async (songName: string, meta: DownloadMetaInput) => {
    const result = await requestDownload(songName)
    // Recorded under the server's id, so the registry and the panel agree on identity. A failed
    // request records nothing: there is no download to remember.
    if (result) library.record(result.downloadId, meta)
  }

  // The page's X only ever appears on a still-live row, so forgetting the library entry alone
  // would not remove it: joinItems re-synthesises a row for any live card with no entry. Dismissing
  // it in useActiveDownloads too is what actually makes it disappear, and keeps a later feed
  // response from resurrecting it.
  const handleRemoveDownload = (downloadId: string) => {
    library.remove(downloadId)
    dismissDownload(downloadId)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Both pages stay mounted and the inactive one is hidden, so a search survives a trip to
          Downloads and back. Cheap here - neither page owns a poll loop of its own. */}
      <div hidden={page !== 'home'}>
        <HomePage
          onNavigateToDownloads={() => setPage('downloads')}
          onDownload={(songName, meta) => { void handleDownload(songName, meta) }}
        />
      </div>
      <div hidden={page !== 'downloads'}>
        <DownloadsPage
          items={library.items}
          pollIntervalMs={pollIntervalMs}
          onNavigateHome={() => setPage('home')}
          onRemove={handleRemoveDownload}
        />
      </div>

      <DownloadPanel
        cards={downloadCards}
        exiting={exitingDownloadIds}
        pollIntervalMs={pollIntervalMs}
        minimized={downloadsMinimized}
        onToggleMinimized={() => setDownloadsMinimized(m => !m)}
        onDismiss={dismissDownload}
        muted={muted}
        onToggleMuted={toggleMuted}
      />
    </div>
  )
}

export default App
