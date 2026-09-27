import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { DownloadsPage } from './pages/DownloadsPage'
import { CollectionPage } from './pages/CollectionPage'
import { ArtistPage } from './pages/ArtistPage'
import { DownloadPanel } from './components/DownloadPanel'
import { SongInfoDialog } from './components/SongInfoDialog'
import { useActiveDownloads } from './hooks/useActiveDownloads'
import { useDownloadLibrary } from './hooks/useDownloadLibrary'
import { useDismissSound } from './hooks/useDismissSound'
import { DownloadMetaInput } from './lib/downloadLibrary'
import { DownloadType } from './api/types'

function App() {
  const navigate = useNavigate()
  // A new page starts at the top; the query string (search, downloads paging) is not a new page.
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
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
  // Which song's info pop-up is open, and on which page. One dialog for the whole app: every song row
  // opens it by id. Leaving that page (a link, Back, Forward) closes it: the pop-up belongs to the row
  // it was opened from. The dialog's own close event then clears the record.
  const [songInfo, setSongInfo] = useState<{ id: string; pathname: string } | null>(null)
  const songInfoId = songInfo?.pathname === pathname ? songInfo.id : null
  const openSongInfo = (id: string) => setSongInfo({ id, pathname })
  const closeSongInfo = () => setSongInfo(null)

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
            onInfo={openSongInfo}
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
        <Route path="/album/:id" element={<CollectionPage type="ALBUM" onDownload={handleDownload} onInfo={openSongInfo} />} />
        <Route path="/playlist/:id" element={<CollectionPage type="PLAYLIST" onDownload={handleDownload} onInfo={openSongInfo} />} />
        <Route path="/artist/:id" element={<ArtistPage onDownload={handleDownload} onInfo={openSongInfo} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <SongInfoDialog
        videoId={songInfoId}
        onClose={closeSongInfo}
        onDownload={handleDownload}
      />

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
