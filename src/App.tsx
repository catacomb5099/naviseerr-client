import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { DownloadsPage } from './pages/DownloadsPage'
import { DownloadPanel } from './components/DownloadPanel'
import { useActiveDownloads } from './hooks/useActiveDownloads'
import { useDownloadLibrary } from './hooks/useDownloadLibrary'
import { useDismissSound } from './hooks/useDismissSound'
import { DownloadMetaInput } from './lib/downloadLibrary'
import { DownloadType } from './api/types'

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

  /** True once the server accepted the request - what a button that asked for it shows. */
  const handleDownload = async (
    id: string,
    type: DownloadType,
    meta: DownloadMetaInput,
  ): Promise<boolean> => {
    const result = await requestDownload(id, type, meta)
    // Recorded under the server's id, so the cache and the panel agree on identity. A failed
    // request records nothing: there is no download to remember.
    if (result) library.record(result.downloadId, meta)
    return result !== null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Routes replace the pair of `hidden` divs that used to switch between the two pages. */}
      <Routes>
        <Route path="/" element={
          <HomePage
            onNavigateToDownloads={() => navigate('/downloads')}
            onDownload={handleDownload}
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
