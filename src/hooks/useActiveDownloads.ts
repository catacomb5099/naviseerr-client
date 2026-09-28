import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client'
import {
  getActiveDownloads, resolveDownloads, downloadSong, downloadCollection, cancelDownload, retryDownload,
} from '../api/endpoints'
import { ActiveDownloadsResponse, ActiveDownloadView, Download, DownloadType } from '../api/types'
import {
  DownloadCardState, dismissTtlMs, dismissedRetentionMs, isTerminal, mergeCard, replaceCard, sortCards,
} from '../lib/downloadPanel'
import { DownloadMetaInput } from '../lib/downloadLibrary'
import { ACTIVE_POLL_MS, nextPollDelayMs } from '../lib/downloadPolling'

// v3: songName became title/artists/imageUrl plus a download type and song tallies. An older
// snapshot is discarded rather than migrated - it is at most a few minutes of download cards, and
// reconciliation would rebuild anything still live anyway.
const STORAGE_KEY = 'naviseerr.downloads.v3'
const STORAGE_VERSION = 3
const EXIT_ANIMATION_MS = 360
const DEFAULT_RETENTION_MS = 600000

interface DismissedEntry {
  id: string
  at: number
}

interface Snapshot {
  v: number
  savedAt: number
  minimized: boolean
  cards: DownloadCardState[]
  dismissed: DismissedEntry[]
}

/**
 * Deliberately unbounded in age. The old 30-minute cap dropped the whole snapshot, which meant
 * "persists across a reload" but not "across a restart" - close the app over lunch and every card
 * was gone whether or not the download had finished. Keeping it is safe now because a stale card
 * can no longer linger on a guess: reconciliation asks the server about each one on startup.
 */
function loadSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Snapshot
    if (parsed.v !== STORAGE_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function isView(x: unknown): x is ActiveDownloadView {
  return typeof x === 'object' && x !== null && 'downloadId' in x && 'stage' in x
}

function saveSnapshot(snapshot: Snapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // best effort - private mode / storage disabled just means no persistence
  }
}

/**
 * Owns the download feed: polls GET /downloads/active, reconciles cards restored from a previous
 * session against GET /downloads?ids=, and auto-dismisses terminal cards on a count-scaled TTL.
 *
 * The invariant the whole hook is built around: **a card is only ever removed deliberately.** The
 * user's X, the terminal TTL, or the server explicitly saying it has no such row. Never a timeout on
 * a card that is merely absent from a response, because absence is the normal state of a download
 * the runner has not picked up yet, and dismissing those is how a card vanished mid-flight while
 * still reading "in progress".
 */
export function useActiveDownloads(playSwoosh: () => void) {
  const initial = useRef(loadSnapshot()).current

  const [cards, setCards] = useState<Record<string, DownloadCardState>>(() => {
    const result: Record<string, DownloadCardState> = {}
    // A snapshot written before songsCancelled existed has no such field; the type says number.
    initial?.cards.forEach(c => { result[c.downloadId] = { ...c, songsCancelled: c.songsCancelled ?? 0 } })
    return result
  })
  const [exiting, setExiting] = useState<Set<string>>(new Set())
  const [minimized, setMinimized] = useState<boolean>(initial?.minimized ?? false)
  const dismissedRef = useRef<Map<string, number>>(
    new Map((initial?.dismissed ?? []).map(d => [d.id, d.at])))
  const pollIntervalRef = useRef<number>(ACTIVE_POLL_MS)
  const retentionRef = useRef<number>(DEFAULT_RETENTION_MS)
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(ACTIVE_POLL_MS)
  // The two inputs that pick the polling speed (see lib/downloadPolling): did the server's last
  // answer list anything still running, and when did the user last click download here.
  const serverHasLiveRef = useRef(false)
  const lastRequestedAtRef = useRef<number | null>(null)
  const [terminalRetentionMs, setTerminalRetentionMs] = useState<number>(DEFAULT_RETENTION_MS)

  const timeoutRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const startedRef = useRef(false)
  // Seeded at mount, not 0, so the first grace window is measured from startup - boot has already
  // reconciled the restored cards and does not need doing again on the very first poll.
  const staleReconciledAtRef = useRef<number>(Date.now())
  const cardsRef = useRef<Record<string, DownloadCardState>>(cards)
  const exitingRef = useRef<Set<string>>(exiting)
  const inFlightRef = useRef<Set<string>>(new Set())
  const [inFlight, setInFlight] = useState<Set<string>>(new Set())

  useEffect(() => { cardsRef.current = cards }, [cards])
  useEffect(() => { exitingRef.current = exiting }, [exiting])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      saveSnapshot({
        v: STORAGE_VERSION,
        savedAt: Date.now(),
        minimized,
        cards: Object.values(cards),
        dismissed: Array.from(dismissedRef.current, ([id, at]) => ({ id, at })),
      })
    }, 300)
    return () => window.clearTimeout(handle)
  }, [cards, minimized])

  const removeCard = useCallback((id: string) => {
    setCards(prev => {
      if (!(id in prev)) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
    setExiting(prev => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const dismiss = useCallback((id: string, opts?: { silent?: boolean }) => {
    // Pruned by AGE, not by count. A count cap evicts the oldest ids regardless of whether the
    // server has stopped reporting them, and an id evicted too early makes a dismissed card
    // reappear on the next poll.
    const cutoff = Date.now() - dismissedRetentionMs(retentionRef.current)
    for (const [known, at] of dismissedRef.current) {
      if (at < cutoff) dismissedRef.current.delete(known)
    }
    dismissedRef.current.set(id, Date.now())

    if (!opts?.silent) playSwoosh()
    setExiting(prev => new Set(prev).add(id))
    window.setTimeout(() => removeCard(id), EXIT_ANIMATION_MS)
  }, [playSwoosh, removeCard])

  const applyRows = useCallback((rows: ActiveDownloadView[]) => {
    setCards(prev => {
      const next = { ...prev }
      for (const row of rows) {
        if (dismissedRef.current.has(row.downloadId)) {
          // A finished row for a dismissed card stays dismissed. A LIVE row for one can only mean the
          // download was retried (from this tab or another), and a retried download gets its card back.
          if (isTerminal(row.stage)) continue
          dismissedRef.current.delete(row.downloadId)
        }
        next[row.downloadId] = mergeCard(prev[row.downloadId], row)
      }
      // Anything not in `rows` is left exactly as it was. A download the runner has not admitted
      // yet is legitimately absent from the feed, and so is one the server is slow to report.
      return next
    })
  }, [])

  /**
   * Asks the server directly about cards restored from a previous session. This is the ONLY place an
   * absent id removes a card: /downloads?ids= ignores both the terminal filter and the retention
   * window, so a row missing from its response does not exist at all. A card that finished while the
   * app was closed gets its real outcome here instead of being guessed at or silently dropped.
   */
  const reconcile = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return
    try {
      const rows = await resolveDownloads(ids)
      applyRows(rows)
      const found = new Set(rows.map(r => r.downloadId))
      ids.filter(id => !found.has(id)).forEach(id => dismiss(id, { silent: true }))
    } catch (err) {
      // Leave the cards alone. A failed lookup is not evidence about any of them, and the next
      // poll may well report them anyway.
      console.error('Failed to reconcile restored downloads:', err)
    }
  }, [applyRows, dismiss])

  /**
   * Non-terminal cards the feed has stopped mentioning for long enough that silence is no longer
   * explainable by the runner being slow.
   *
   * These are NOT dismissed on that basis - absence still never mutates a card. They are handed to
   * reconcile, which asks the server directly and gets a real answer either way. Without this, a card
   * could be pinned forever: if the tab is backgrounded past the retention window, its download
   * finishes and ages out of the feed while nothing is polling, and on return the row is simply gone.
   * Startup reconciliation covers a restart; this covers a session that was merely idle.
   */
  const staleIds = useCallback((response: ActiveDownloadsResponse): string[] => {
    // One grace period, generous enough that a queued download is never mistaken for a lost one.
    const graceMs = Math.max(15000, response.pollIntervalMs * 3)
    if (Date.now() - staleReconciledAtRef.current < graceMs) return []

    const reported = new Set(response.downloads.map(row => row.downloadId))
    const cutoff = Date.now() - graceMs
    return Object.values(cardsRef.current)
      .filter(card => !reported.has(card.downloadId)
        && !isTerminal(card.stage)
        // dismissedRef is written synchronously by dismiss(); exitingRef only catches up on the
        // next render, so a card dismissed moments ago would otherwise be re-looked-up here.
        && !dismissedRef.current.has(card.downloadId)
        && !exitingRef.current.has(card.downloadId)
        && card.lastSeenAt < cutoff)
      .map(card => card.downloadId)
  }, [])

  const poll = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const response = await getActiveDownloads(controller.signal)
      pollIntervalRef.current = response.pollIntervalMs
      retentionRef.current = response.terminalRetentionMs
      setPollIntervalMs(response.pollIntervalMs)
      setTerminalRetentionMs(response.terminalRetentionMs)
      serverHasLiveRef.current = response.downloads.some(row => !isTerminal(row.stage))

      // Computed BEFORE applying, so it reads the state the response is about to overwrite.
      const stale = staleIds(response)
      applyRows(response.downloads)
      if (stale.length > 0) {
        staleReconciledAtRef.current = Date.now()
        void reconcile(stale)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('Failed to poll active downloads:', err)
    }
  }, [applyRows, staleIds, reconcile])

  /**
   * Books the next poll at whichever speed fits right now: fast while something is downloading or
   * was just requested, slow when there is nothing to show. A hidden tab books nothing at all - the
   * visibilitychange listener polls and restarts the loop when the tab comes back.
   */
  const scheduleNext = useCallback(() => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    if (document.hidden) return
    const delayMs = nextPollDelayMs({
      serverHasLive: serverHasLiveRef.current,
      lastRequestedAt: lastRequestedAtRef.current,
      now: Date.now(),
      serverPollIntervalMs: pollIntervalRef.current,
    })
    timeoutRef.current = window.setTimeout(async () => {
      // Went hidden since this was booked: stop here, the listener restarts us on return.
      if (document.hidden) return
      await poll()
      scheduleNext()
    }, delayMs)
  }, [poll])

  /** One request now, then carry on at whatever speed the answer calls for. */
  const pollNow = useCallback(async () => {
    await poll()
    scheduleNext()
  }, [poll, scheduleNext])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const restored = Object.values(cardsRef.current)
    // A terminal card whose TTL already elapsed while the app was closed should not flash up.
    const ttl = dismissTtlMs(restored.length, retentionRef.current)
    restored.forEach(card => {
      if (isTerminal(card.stage) && Date.now() - card.lastChangedAt >= ttl) {
        dismiss(card.downloadId, { silent: true })
      }
    })

    const boot = async () => {
      await reconcile(restored
        .filter(card => !isTerminal(card.stage))
        .map(card => card.downloadId))
      await pollNow()
    }
    void boot()

    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
      abortRef.current?.abort()
    }
    // Intentionally runs once: this owns a singleton poll loop, guarded by startedRef against
    // React StrictMode's double-invoked effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Its own effect, NOT inside the run-once one above: StrictMode runs that effect's cleanup and
  // then skips the re-run, which used to leave this listener removed for good in development.
  // A hidden tab books no timer, so this listener is the only thing that restarts polling.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (!document.hidden) void pollNow()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [pollNow])

  useEffect(() => {
    const handle = window.setInterval(() => {
      const list = Object.values(cards)
      const ttl = dismissTtlMs(list.length, retentionRef.current)
      list.forEach(card => {
        if (isTerminal(card.stage) && !exitingRef.current.has(card.downloadId)
          && !inFlightRef.current.has(card.downloadId)) {
          if (Date.now() - card.lastChangedAt >= ttl) {
            dismiss(card.downloadId)
          }
        }
      })
    }, 1000)
    return () => window.clearInterval(handle)
  }, [cards, dismiss])

  const requestDownload = useCallback(async (
    id: string,
    type: DownloadType,
    meta: DownloadMetaInput,
  ): Promise<Download | null> => {
    try {
      const result = type === 'SONG' ? await downloadSong(id) : await downloadCollection(id, type)
      // Optimistic, and under the download's REAL id - the 202 body carries it, so there is no
      // temporary identity for the first feed response to reconcile against. The card is honest
      // about what the server has actually promised: accepted, not yet started. The 202 carries no
      // name, so title/artists/artwork come from what the client knew when it clicked.
      setCards(prev => ({
        ...prev,
        [result.downloadId]: {
          downloadId: result.downloadId,
          youtubeId: result.youtubeId,
          downloadType: result.downloadType,
          title: meta.title,
          artists: meta.artistNames,
          imageUrl: meta.iconURL,
          stage: 'QUEUED',
          progressPercent: null,
          songCount: 0,
          songsSucceeded: 0,
          songsFailed: 0,
          songsCancelled: 0,
          failureCode: null,
          requestedAt: result.createdAt,
          stageEnteredAt: result.createdAt,
          updatedAt: result.createdAt,
          lastChangedAt: Date.now(),
          lastSeenAt: Date.now(),
        },
      }))
      // Ask straight away, and stay on the fast speed for a while even if the server has not
      // listed the download yet - see FAST_WINDOW_AFTER_REQUEST_MS.
      lastRequestedAtRef.current = Date.now()
      void pollNow()
      return result
    } catch (err) {
      console.error('Download request failed:', err)
      return null
    }
  }, [pollNow])

  /**
   * One retry or cancel. `key` is the task id for a song, else the download id, so two songs of one
   * album can be cancelled at once while the whole-download button stays single-flight. The server
   * refuses a duplicate anyway (409); this stops the duplicate being sent at all.
   */
  const act = useCallback(async (id: string, key: string, call: () => Promise<ActiveDownloadView>) => {
    if (inFlightRef.current.has(key)) return
    inFlightRef.current.add(key); setInFlight(new Set(inFlightRef.current))
    try {
      const view = await call()
      dismissedRef.current.delete(id)   // a dismissed card that the user acts on comes back
      setCards(prev => ({ ...prev, [id]: replaceCard(prev[id], view) }))
      lastRequestedAtRef.current = Date.now()   // the 30 s fast-poll window, as after a new request
      void pollNow()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && isView(err.body)) {
        applyRows([err.body]); void pollNow()   // the server's answer is settled; show it
      } else if (err instanceof ApiError && err.status === 404) {
        dismiss(id, { silent: true })
      } else {
        console.error('Download action failed:', err)
      }
    } finally {
      inFlightRef.current.delete(key); setInFlight(new Set(inFlightRef.current))
    }
  }, [applyRows, dismiss, pollNow])

  const cancel = useCallback((id: string, taskId?: string) =>
    act(id, taskId ?? id, () => cancelDownload(id, taskId)), [act])

  const retry = useCallback((id: string) => act(id, id, () => retryDownload(id)), [act])

  return {
    cards: sortCards(Object.values(cards)),
    exiting,
    pollIntervalMs,
    terminalRetentionMs,
    minimized,
    setMinimized,
    dismiss,
    requestDownload,
    cancel,
    retry,
    inFlight,
  }
}
