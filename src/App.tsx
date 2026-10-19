import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { DownloadsPage } from './pages/DownloadsPage'
import { CollectionPage } from './pages/CollectionPage'
import { ArtistPage } from './pages/ArtistPage'
import { SuggestedPlaylistPage } from './pages/SuggestedPlaylistPage'
import { SettingsPage } from './pages/SettingsPage'
import { LoginPage } from './pages/LoginPage'
import { ConnectivityBar } from './components/ConnectivityBar'
import { DownloadPanel } from './components/DownloadPanel'
import { SongInfoDialog } from './components/SongInfoDialog'
import { SoulseekStatusBar } from './components/SoulseekStatusBar'
import { useActiveDownloads } from './hooks/useActiveDownloads'
import { useSession } from './hooks/useSession'
import { DownloadCardsContext } from './hooks/useItemDownload'
import { useDownloadLibrary } from './hooks/useDownloadLibrary'
import { useDismissSound } from './hooks/useDismissSound'
import { DownloadMetaInput } from './lib/downloadLibrary'
import { RequestOutcome } from './lib/downloadPanel'
import { DownloadRequestOptions, getSession } from './api/endpoints'
import { DownloadType } from './api/types'
import { applySession } from './lib/session'

function App() {
  // Whether somebody is signed in gates everything below: 'out' shows the login screen, and only 'in'
  // renders the pages (and lets the downloads feed poll). An install with no login on is always 'in'.
  const session = useSession()
  useEffect(() => {
    // Asked once at start, and again whenever a 401 logs this tab out (the server may be open after all,
    // or a login may have been turned on from another device). A server that does not answer is asked
    // again every five seconds; the amber bar says so.
    if (session.status !== 'unknown' && session.status !== 'out') return
    let handle: number | undefined
    const ask = () => getSession().then(applySession, () => { handle = window.setTimeout(ask, 5000) })
    void ask()
    return () => window.clearTimeout(handle)
  }, [session.status])
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
    toggleMinimized: toggleDownloadsMinimized,
    dismiss: dismissDownload,
    requestDownload,
    cancel: cancelDownload,
    retry: retryDownload,
    pick: pickDownload,
    inFlight: downloadsInFlight,
    soulseekLoggedIn,
    soulseekUsername,
    libraryProblem,
    youtubeMusicDown,
  } = useActiveDownloads(playSwoosh, session.status === 'in')
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

  if (session.status !== 'in') {
    // The address is kept as it is, so logging in at /downloads lands on the Downloads page.
    return (
      <div className="min-h-screen bg-black text-white">
        <ConnectivityBar />
        {session.status === 'out' && <LoginPage />}
      </div>
    )
  }

  return (
    <DownloadCardsContext.Provider value={downloadCards}>
    {/* On a phone the folded downloads pill sits over the bottom edge: leave room so the last row stays reachable. */}
    <div className={`min-h-screen bg-black text-white ${downloadCards.length ? 'pb-16 sm:pb-0' : ''}`}>
      {/* Above the routes, so it spans the window and survives every page change. */}
      <ConnectivityBar />
      <SoulseekStatusBar loggedIn={soulseekLoggedIn} username={soulseekUsername} libraryProblem={libraryProblem} youtubeMusicDown={youtubeMusicDown} />
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
        <Route path="/settings" element={<SettingsPage onNavigateHome={() => navigate('/')} />} />
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
        onToggleMinimized={toggleDownloadsMinimized}
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
