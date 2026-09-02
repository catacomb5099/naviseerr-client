import { useCallback, useEffect, useMemo, useState } from 'react'
import { DownloadCardState } from '../lib/downloadPanel'
import {
  DownloadItem, DownloadLibraryEntry, DownloadMetaInput,
  applyCardsToEntries, evictToCap, initialSnapshot, joinItems,
} from '../lib/downloadLibrary'

// v1: first shape of the persisted library. Version-gated and discarded on mismatch rather than
// migrated, exactly like the panel's snapshot - the cost is a lost history list, not lost data.
const STORAGE_KEY = 'naviseerr.downloadLibrary.v1'
const STORAGE_VERSION = 1
const SAVE_DEBOUNCE_MS = 300

interface LibrarySnapshot {
  v: number
  savedAt: number
  entries: DownloadLibraryEntry[]
}

function loadEntries(): Record<string, DownloadLibraryEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as LibrarySnapshot
    if (parsed.v !== STORAGE_VERSION || !Array.isArray(parsed.entries)) return {}
    const result: Record<string, DownloadLibraryEntry> = {}
    for (const entry of parsed.entries) {
      if (entry?.meta?.downloadId && entry.snapshot) result[entry.meta.downloadId] = entry
    }
    return result
  } catch {
    return {}
  }
}

export interface DownloadLibrary {
  items: DownloadItem[]
  /** Called right after POST /download returns, under the download's real id. */
  record: (downloadId: string, meta: DownloadMetaInput) => void
  /** Forgets a row on the page. Does not touch the panel or the server. */
  remove: (downloadId: string) => void
}

/**
 * The durable half of the downloads feature: a localStorage registry of what was requested,
 * joined with whatever the live feed currently says.
 *
 * It deliberately owns no network. `cards` comes from useActiveDownloads, which already polls; a
 * second loop here would double the request rate and could disagree with the panel about the same
 * download. The price is that a stage is only ever learned while the app is open, which is exactly
 * what the persisted snapshot exists to paper over.
 */
export function useDownloadLibrary(cards: DownloadCardState[]): DownloadLibrary {
  const [entries, setEntries] = useState<Record<string, DownloadLibraryEntry>>(loadEntries)

  // Folding the live cards into the stored snapshots is a pure derivation of (entries, cards), not
  // a side effect - it subscribes to nothing external and writes nothing external. Computing it in
  // an effect would mean calling setState on every card change purely to keep a value in sync that
  // render can already produce for free, so it lives in this useMemo instead. `entries` itself only
  // ever changes for a real write: `record` or `remove`.
  const foldedEntries = useMemo(() => applyCardsToEntries(entries, cards), [entries, cards])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          v: STORAGE_VERSION,
          savedAt: Date.now(),
          entries: Object.values(foldedEntries),
        } satisfies LibrarySnapshot))
      } catch {
        // best effort - private mode / storage disabled just means no history
      }
    }, SAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [foldedEntries])

  const record = useCallback((downloadId: string, meta: DownloadMetaInput) => {
    const requestedAt = new Date().toISOString()
    setEntries(prev => {
      // Folded against the latest cards, not `prev` as-is, so a re-download does not fall back to
      // whatever stage happened to be in state the last time `record` or `remove` ran.
      const folded = applyCardsToEntries(prev, cards)
      return evictToCap({
        ...prev,
        [downloadId]: {
          meta: { ...meta, downloadId, requestedAt: prev[downloadId]?.meta.requestedAt ?? requestedAt },
          // Re-requesting the same download keeps the stage already observed for it.
          snapshot: folded[downloadId]?.snapshot ?? initialSnapshot(requestedAt),
        },
      })
    })
  }, [cards])

  const remove = useCallback((downloadId: string) => {
    setEntries(prev => {
      if (!(downloadId in prev)) return prev
      const next = { ...prev }
      delete next[downloadId]
      return next
    })
  }, [])

  const items = useMemo(() => joinItems(foldedEntries, cards), [foldedEntries, cards])

  return { items, record, remove }
}
