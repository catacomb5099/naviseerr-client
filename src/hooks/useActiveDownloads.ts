import { useCallback, useEffect, useRef, useState } from 'react'
import { getActiveDownloads, download } from '../api/endpoints'
import { ActiveDownloadView } from '../api/types'
import { DownloadCardState, dismissTtlMs, isTerminal, sortCards } from '../lib/downloadPanel'

const STORAGE_KEY = 'naviseerr.downloads.v1'
const STORAGE_VERSION = 1
const MAX_SNAPSHOT_AGE_MS = 30 * 60 * 1000
const EXIT_ANIMATION_MS = 360
const DEFAULT_POLL_MS = 5000

interface Snapshot {
  v: number
  savedAt: number
  minimized: boolean
  cards: DownloadCardState[]
  dismissedIds: string[]
}

function loadSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Snapshot
    if (parsed.v !== STORAGE_VERSION) return null
    if (Date.now() - parsed.savedAt > MAX_SNAPSHOT_AGE_MS) return null
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

/** Polls GET /downloads/active, tracks per-card state, persists across
 *  refresh, and auto-dismisses terminal cards on a count-scaled TTL. */
export function useActiveDownloads(playSwoosh: () => void) {
  const initial = useRef(loadSnapshot()).current

  const [cards, setCards] = useState<Record<string, DownloadCardState>>(() => {
    const result: Record<string, DownloadCardState> = {}
    initial?.cards.forEach(c => { result[c.downloadId] = c })
    return result
  })
  const [exiting, setExiting] = useState<Set<string>>(new Set())
  const [minimized, setMinimized] = useState<boolean>(initial?.minimized ?? false)
  const dismissedIdsRef = useRef<Set<string>>(new Set(initial?.dismissedIds ?? []))
  const pollIntervalRef = useRef<number>(DEFAULT_POLL_MS)
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(DEFAULT_POLL_MS)

  const timeoutRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const startedRef = useRef(false)
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
        dismissedIds: Array.from(dismissedIdsRef.current),
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
    dismissedIdsRef.current.add(id)
    // Bound growth over a long session - old ids are only needed long
    // enough to outlive the server's own retention window.
    if (dismissedIdsRef.current.size > 200) {
      const excess = dismissedIdsRef.current.size - 200
      const it = dismissedIdsRef.current.values()
      for (let i = 0; i < excess; i++) {
        const next = it.next()
        if (!next.done) dismissedIdsRef.current.delete(next.value)
      }
    }
    if (!opts?.silent) playSwoosh()
    setExiting(prev => new Set(prev).add(id))
    window.setTimeout(() => removeCard(id), EXIT_ANIMATION_MS)
  }, [playSwoosh, removeCard])

  const mergeResponse = useCallback((downloads: ActiveDownloadView[]) => {
    const prevSnapshot = cardsRef.current
    const seen = new Set<string>()
    for (const row of downloads) seen.add(row.downloadId)

    // A card the server no longer reports has left its retention window
    // (or, for a non-terminal row, was lost/never admitted). Either way the
    // disappearance must go through the same animated dismiss as an X
    // click - the server's retention window can be shorter than our own
    // auto-dismiss TTL, and a card silently vanishing with no swipe or
    // sound breaks the "always telegraph a dismissal" requirement.
    const staleAfterMs = Math.max(15000, pollIntervalRef.current * 3)
    for (const [id, card] of Object.entries(prevSnapshot)) {
      if (seen.has(id) || exitingRef.current.has(id) || dismissedIdsRef.current.has(id)) continue
      const isGone = isTerminal(card.status) || Date.now() - card.lastSeenAt >= staleAfterMs
      if (isGone) dismiss(id)
    }

    setCards(prev => {
      const next: Record<string, DownloadCardState> = {}

      for (const row of downloads) {
        if (dismissedIdsRef.current.has(row.downloadId)) continue

        const existing = prev[row.downloadId]
        // Never overwrite a real value with a null sample - an absent
        // progress reading must never make a healthy bar jump backwards.
        const progressPercent = row.progressPercent ?? existing?.progressPercent ?? null
        const changed = !existing
          || existing.status !== row.status
          || existing.progressPercent !== row.progressPercent

        next[row.downloadId] = {
          downloadId: row.downloadId,
          songName: row.songName,
          status: row.status,
          progressPercent,
          phaseEnteredAt: row.phaseEnteredAt,
          lastChangedAt: changed ? Date.now() : (existing?.lastChangedAt ?? Date.now()),
          lastSeenAt: Date.now(),
          shownPercent: existing?.shownPercent ?? 0,
        }
      }

      // A non-terminal card missing from this response is kept until the
      // server catches up or the staleness check above dismisses it.
      for (const [id, card] of Object.entries(prev)) {
        if (!(id in next) && !seen.has(id)) {
          next[id] = card
        }
      }

      return next
    })
  }, [dismiss])

  const poll = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const response = await getActiveDownloads(controller.signal)
      pollIntervalRef.current = response.pollIntervalMs
      setPollIntervalMs(response.pollIntervalMs)
      mergeResponse(response.downloads)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('Failed to poll active downloads:', err)
    }
  }, [mergeResponse])

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

    Object.values(cards).forEach(card => {
      if (isTerminal(card.status)) {
        const ttl = dismissTtlMs(Object.keys(cards).length)
        const age = Date.now() - card.lastChangedAt
        if (age >= ttl) {
          dismiss(card.downloadId, { silent: true })
        }
      }
    })

    poll().then(() => scheduleNext(pollIntervalRef.current))

    const onVisibilityChange = () => {
      if (!document.hidden) poll()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
      abortRef.current?.abort()
    }
    // Intentionally runs once: this owns a singleton poll loop, guarded by
    // startedRef against React StrictMode's double-invoked effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handle = window.setInterval(() => {
      const list = Object.values(cards)
      const ttl = dismissTtlMs(list.length)
      list.forEach(card => {
        if (isTerminal(card.status) && !exiting.has(card.downloadId)) {
          if (Date.now() - card.lastChangedAt >= ttl) {
            dismiss(card.downloadId)
          }
        }
      })
    }, 1000)
    return () => window.clearInterval(handle)
  }, [cards, exiting, dismiss])

  const requestDownload = useCallback(async (songName: string) => {
    try {
      const result = await download(songName)
      setCards(prev => ({
        ...prev,
        [result.downloadId]: {
          downloadId: result.downloadId,
          songName: result.songName,
          status: result.status,
          progressPercent: null,
          phaseEnteredAt: result.createdAt,
          lastChangedAt: Date.now(),
          lastSeenAt: Date.now(),
          shownPercent: 0,
        },
      }))
      poll()
    } catch (err) {
      console.error('Download request failed:', err)
    }
  }, [poll])

  return {
    cards: sortCards(Object.values(cards)),
    exiting,
    pollIntervalMs,
    minimized,
    setMinimized,
    dismiss,
    requestDownload,
  }
}
