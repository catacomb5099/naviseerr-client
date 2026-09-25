import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getActiveDownloads, resolveDownloads, downloadSong, downloadCollection,
} from '../api/endpoints'
import { ActiveDownloadsResponse, ActiveDownloadView, Download, DownloadType } from '../api/types'
import {
  DownloadCardState, dismissTtlMs, dismissedRetentionMs, isTerminal, mergeCard, sortCards,
} from '../lib/downloadPanel'
import { DownloadMetaInput } from '../lib/downloadLibrary'

// v3: songName became title/artists/imageUrl plus a download type and song tallies. An older
// snapshot is discarded rather than migrated - it is at most a few minutes of download cards, and
// reconciliation would rebuild anything still live anyway.
const STORAGE_KEY = 'naviseerr.downloads.v3'
const STORAGE_VERSION = 3
const EXIT_ANIMATION_MS = 360
const DEFAULT_POLL_MS = 5000
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
    initial?.cards.forEach(c => { result[c.downloadId] = c })
    return result
  })
  const [exiting, setExiting] = useState<Set<string>>(new Set())
  const [minimized, setMinimized] = useState<boolean>(initial?.minimized ?? false)
  const dismissedRef = useRef<Map<string, number>>(
    new Map((initial?.dismissed ?? []).map(d => [d.id, d.at])))
  const pollIntervalRef = useRef<number>(DEFAULT_POLL_MS)
  const retentionRef = useRef<number>(DEFAULT_RETENTION_MS)
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(DEFAULT_POLL_MS)
  const [terminalRetentionMs, setTerminalRetentionMs] = useState<number>(DEFAULT_RETENTION_MS)

  const timeoutRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const startedRef = useRef(false)
  // Seeded at mount, not 0, so the first grace window is measured from startup - boot has already
  // reconciled the restored cards and does not need doing again on the very first poll.
  const staleReconciledAtRef = useRef<number>(Date.now())
  const cardsRef = useRef<Record<string, DownloadCardState>>(cards)
  const exitingRef = useRef<Set<string>>(exiting)

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
        if (dismissedRef.current.has(row.downloadId)) continue
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

  const scheduleNext = useCallback((delayMs: number) => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(async () => {
      if (document.hidden) {
        scheduleNext(pollIntervalRef.current)
        return
      }
      await poll()
      scheduleNext(pollIntervalRef.current)
    }, delayMs)
  }, [poll])

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
      await poll()
      scheduleNext(pollIntervalRef.current)
    }
    void boot()

    const onVisibilityChange = () => {
      if (!document.hidden) poll()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
      abortRef.current?.abort()
    }
    // Intentionally runs once: this owns a singleton poll loop, guarded by startedRef against
    // React StrictMode's double-invoked effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handle = window.setInterval(() => {
      const list = Object.values(cards)
      const ttl = dismissTtlMs(list.length, retentionRef.current)
      list.forEach(card => {
        if (isTerminal(card.stage) && !exitingRef.current.has(card.downloadId)) {
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
          failureCode: null,
          requestedAt: result.createdAt,
          stageEnteredAt: result.createdAt,
          updatedAt: result.createdAt,
          lastChangedAt: Date.now(),
          lastSeenAt: Date.now(),
        },
      }))
      poll()
      return result
    } catch (err) {
      console.error('Download request failed:', err)
      return null
    }
  }, [poll])

  return {
    cards: sortCards(Object.values(cards)),
    exiting,
    pollIntervalMs,
    terminalRetentionMs,
    minimized,
    setMinimized,
    dismiss,
    requestDownload,
  }
}
