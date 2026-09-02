import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { DownloadsPage } from './pages/DownloadsPage'
import { DownloadPanel } from './components/DownloadPanel'
import { useActiveDownloads } from './hooks/useActiveDownloads'
import { useDownloadLibrary } from './hooks/useDownloadLibrary'
import { useDismissSound } from './hooks/useDismissSound'
import { useSearch } from './hooks/useSearch'
import { DownloadMetaInput } from './lib/downloadLibrary'

function App() {
  const navigate = useNavigate()
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
  const library = useDownloadLibrary()
  const search = useSearch()

  const handleDownload = async (songName: string, meta: DownloadMetaInput) => {
    const result = await requestDownload(songName)
    // Recorded under the server's id, so the registry and the panel agree on identity. A failed
    // request records nothing: there is no download to remember.
    if (result) library.record(result.downloadId, meta)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Routes unmount the inactive page, so the search state lives in useSearch at this level
          instead of on HomePage - that's what lets it survive a trip to Downloads and back. */}
      <Routes>
        <Route path="/" element={
          <HomePage
            query={search.query}
            results={search.results}
            loading={search.loading}
            error={search.error}
            selectedPill={search.selectedPill}
            onSearch={search.runSearch}
            onPillChange={search.changePill}
            onNavigateToDownloads={() => navigate('/downloads')}
            onDownload={(songName, meta) => { void handleDownload(songName, meta) }}
          />
        } />
        <Route path="/downloads" element={
          <DownloadsPage
            metas={library.metas}
            cards={downloadCards}
            pollIntervalMs={pollIntervalMs}
            onNavigateHome={() => navigate('/')}
          />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

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
