import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { DownloadsPage } from './pages/DownloadsPage'
import { CollectionPage } from './pages/CollectionPage'
import { ArtistPage } from './pages/ArtistPage'
import { ArtistShelfPage } from './pages/ArtistShelfPage'
import { SuggestedPlaylistPage } from './pages/SuggestedPlaylistPage'
import { SettingsPage } from './pages/SettingsPage'
import { LibraryPage } from './pages/LibraryPage'
import { PlaylistPage } from './pages/PlaylistPage'
import { SetupPage } from './pages/SetupPage'
import { LoginPage } from './pages/LoginPage'
import { ConnectivityBar } from './components/ConnectivityBar'
import { DownloadPanel } from './components/DownloadPanel'
import { SongInfoDialog } from './components/SongInfoDialog'
import { AddToPlaylistDialog, AddedNote } from './components/AddToPlaylistDialog'
import { AddTarget, AddToPlaylistContext } from './hooks/useAddToPlaylist'
import { SoulseekStatusBar } from './components/SoulseekStatusBar'
import { useActiveDownloads } from './hooks/useActiveDownloads'
import { useSession } from './hooks/useSession'
import { useSetup } from './hooks/useSetup'
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
  // Once signed in (or on an install with no login), has this install been set up? Until it has, the
  // first-run screens stand in for the app, as the login card does. Login first: a connected Authentik
  // must not let strangers see the setup.
  const { setup, finished: setupFinished } = useSetup(session.status === 'in')
  // Both gates passed: the pages render, and the downloads feed may poll.
  const ready = session.status === 'in' && setup?.completed === true
  const navigate = useNavigate()
  // A new page starts at the top, or at the section its address names (/settings#login, which React
  // Router does not scroll to); the query string (search, downloads paging) is not a new page. Runs
  // again when `ready` flips, since a page opened by its address mounts only then; and once more a
  // moment later, because the sections above the named one fill in and push it down.
  const { pathname, hash } = useLocation()
  useEffect(() => {
    const section = hash ? document.getElementById(hash.slice(1)) : null
    if (!section) { window.scrollTo(0, 0); return }
    section.scrollIntoView()
    const again = window.setTimeout(() => section.scrollIntoView(), 1000)
    return () => window.clearTimeout(again)
  }, [pathname, hash, ready])
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
  } = useActiveDownloads(playSwoosh, ready)
  const library = useDownloadLibrary()
  // Which song's info pop-up is open, and on which page. One dialog for the whole app: every song row
  // opens it by id. Leaving that page (a link, Back, Forward) closes it: the pop-up belongs to the row
  // it was opened from. The dialog's own close event then clears the record.
  // `plays` is the count the row showed, so the pop-up repeats it rather than a different number.
  const [songInfo, setSongInfo] = useState<{ id: string; pathname: string; plays: string | null } | null>(null)
  const songInfoId = songInfo?.pathname === pathname ? songInfo.id : null
  const openSongInfo = (id: string, plays?: string | null) => setSongInfo({ id, pathname, plays: plays ?? null })
  const closeSongInfo = () => setSongInfo(null)
  // The one "Add to playlist" pop-up, mounted afresh for each opening (the count is its key), and the line
  // that says what was added. Like the song pop-up, it belongs to the page it was opened on.
  const opened = useRef(0)
  const [adding, setAdding] = useState<{ target: AddTarget; pathname: string; n: number } | null>(null)
  const openAddToPlaylist = useCallback((target: AddTarget) => {
    setSongInfo(null)
    setAdding({ target, pathname, n: ++opened.current })
  }, [pathname])
  const [added, setAdded] = useState<{ message: string; playlistId: string; n: number } | null>(null)
  const clearAdded = useCallback(() => setAdded(null), [])

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

  if (!setup?.completed) {
    // Nothing but the bar while unknown (no flash of Home); then the setup, whose address is its step.
    return (
      <div className="min-h-screen bg-black text-white">
        <ConnectivityBar />
        {setup && (
          <Routes>
            <Route path="/setup/:step?" element={
              <SetupPage libraryRoot={setup.libraryRoot} onFinished={() => { setupFinished(); navigate('/') }} />
            } />
            <Route path="*" element={<Navigate to="/setup/1" replace />} />
          </Routes>
        )}
      </div>
    )
  }

  return (
    <DownloadCardsContext.Provider value={downloadCards}>
    <AddToPlaylistContext.Provider value={openAddToPlaylist}>
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
        <Route path="/artist/:id/albums" element={<ArtistShelfPage shelf="albums" />} />
        <Route path="/artist/:id/singles" element={<ArtistShelfPage shelf="singles" />} />
        <Route path="/artist/:id/playlists" element={<ArtistShelfPage shelf="playlists" />} />
        <Route path="/suggested/:category" element={<SuggestedPlaylistPage onDownload={handleDownload} onInfo={openSongInfo} />} />
        <Route path="/settings" element={<SettingsPage onNavigateHome={() => navigate('/')} />} />
        <Route path="/library" element={<LibraryPage onNavigateHome={() => navigate('/')} />} />
        <Route path="/library/:id" element={<PlaylistPage onDownload={handleDownload} onInfo={openSongInfo} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <SongInfoDialog
        videoId={songInfoId}
        rowPlays={songInfo?.plays ?? null}
        onClose={closeSongInfo}
        onDownload={handleDownload}
      />

      {adding && adding.pathname === pathname && (
        <AddToPlaylistDialog
          key={adding.n}
          target={adding.target}
          onClose={() => setAdding(null)}
          onAdded={(message, playlistId) => setAdded({ message, playlistId, n: adding.n })}
        />
      )}
      {added && <AddedNote key={added.n} message={added.message} playlistId={added.playlistId} onDone={clearAdded} />}

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
    </AddToPlaylistContext.Provider>
    </DownloadCardsContext.Provider>
  )
}

export default App
