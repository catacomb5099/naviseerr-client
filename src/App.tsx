import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { DownloadsPage } from './pages/DownloadsPage'
import { CollectionPage } from './pages/CollectionPage'
import { ArtistPage } from './pages/ArtistPage'
import { SuggestedPlaylistPage } from './pages/SuggestedPlaylistPage'
import { ConnectivityBar } from './components/ConnectivityBar'
import { DownloadPanel } from './components/DownloadPanel'
import { SongInfoDialog } from './components/SongInfoDialog'
import { SoulseekStatusBar } from './components/SoulseekStatusBar'
import { useActiveDownloads } from './hooks/useActiveDownloads'
import { DownloadCardsContext } from './hooks/useItemDownload'
import { useDownloadLibrary } from './hooks/useDownloadLibrary'
import { useDismissSound } from './hooks/useDismissSound'
import { DownloadMetaInput } from './lib/downloadLibrary'
import { RequestOutcome } from './lib/downloadPanel'
import { DownloadRequestOptions } from './api/endpoints'
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
    cancel: cancelDownload,
    retry: retryDownload,
    pick: pickDownload,
    inFlight: downloadsInFlight,
    soulseekLoggedIn,
  } = useActiveDownloads(playSwoosh)
  const library = useDownloadLibrary()
  // Which song's info pop-up is open, and on which page. One dialog for the whole app: every song row
  // opens it by id. Leaving that page (a link, Back, Forward) closes it: the pop-up belongs to the row
  // it was opened from. The dialog's own close event then clears the record.
  // `plays` is the count the row showed, so the pop-up repeats it rather than a different number.
  const [songInfo, setSongInfo] = useState<{ id: string; pathname: string; plays: string | null } | null>(null)
  const songInfoId = songInfo?.pathname === pathname ? songInfo.id : null
  const openSongInfo = (id: string, plays?: string | null) => setSongInfo({ id, pathname, plays: plays ?? null })
  const closeSongInfo = () => setSongInfo(null)

  /** How the request ended - what the page that asked announces. */
  const handleDownload = async (
    id: string,
    type: DownloadType,
    meta: DownloadMetaInput,
    opts?: DownloadRequestOptions,
  ): Promise<RequestOutcome> => {
    const outcome = await requestDownload(id, type, meta, opts)
    // Recorded under the server's id, so the cache and the panel agree on identity. A failed request
    // records nothing, and an existing download already has the server's own name and artwork.
    if (outcome.status === 'accepted') library.record(outcome.download.downloadId, meta)
    return outcome
  }

  return (
    <DownloadCardsContext.Provider value={downloadCards}>
    <div className="min-h-screen bg-black text-white">
      {/* Above the routes, so it spans the window and survives every page change. */}
      <ConnectivityBar />
      <SoulseekStatusBar loggedIn={soulseekLoggedIn} />
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
            onCancel={cancelDownload}
            onRetry={retryDownload}
            onPick={pickDownload}
            onDownloadAgain={item => handleDownload(item.youtubeId, item.downloadType, {
              youtubeId: item.youtubeId,
              downloadType: item.downloadType,
              title: item.title,
              artistNames: item.artistNames,
              albumName: item.albumName,
              iconURL: item.iconURL,
            }, { force: true })}
            inFlight={downloadsInFlight}
            onNavigateHome={() => navigate('/')}
          />
        } />
        <Route path="/album/:id" element={<CollectionPage type="ALBUM" onDownload={handleDownload} onInfo={openSongInfo} />} />
        <Route path="/playlist/:id" element={<CollectionPage type="PLAYLIST" onDownload={handleDownload} onInfo={openSongInfo} />} />
        <Route path="/radio/:id" element={<CollectionPage type="RADIO" onDownload={handleDownload} onInfo={openSongInfo} />} />
        <Route path="/artist/:id" element={<ArtistPage onDownload={handleDownload} onInfo={openSongInfo} />} />
        <Route path="/suggested/:category" element={<SuggestedPlaylistPage onDownload={handleDownload} onInfo={openSongInfo} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <SongInfoDialog
        videoId={songInfoId}
        rowPlays={songInfo?.plays ?? null}
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
        onCancel={cancelDownload}
        onRetry={retryDownload}
        inFlight={downloadsInFlight}
        muted={muted}
        onToggleMuted={toggleMuted}
      />
    </div>
    </DownloadCardsContext.Provider>
  )
}

export default App
