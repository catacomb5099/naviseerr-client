import { useCallback, useEffect, useState } from 'react'
import { DownloadMeta, DownloadMetaInput, evictToCap } from '../lib/downloadLibrary'

// v2: the persisted shape changed from `{meta, snapshot}` entries to bare metas, now that the
// server (not this registry) says which rows exist and what stage they're in. A v1 snapshot is
// discarded rather than migrated - same precedent as this file's own v1 and useActiveDownloads'
// v1->v2 move: the cost is a lost history list, not lost data.
const STORAGE_KEY = 'naviseerr.downloadLibrary.v2'
const STORAGE_VERSION = 2
const SAVE_DEBOUNCE_MS = 300

interface LibrarySnapshot {
  v: number
  savedAt: number
  metas: DownloadMeta[]
}

function loadMetas(): Record<string, DownloadMeta> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as LibrarySnapshot
    if (parsed.v !== STORAGE_VERSION || !Array.isArray(parsed.metas)) return {}
    const result: Record<string, DownloadMeta> = {}
    for (const meta of parsed.metas) {
      if (meta?.downloadId) result[meta.downloadId] = meta
    }
    return result
  } catch {
    return {}
  }
}

export interface DownloadLibrary {
  metas: Record<string, DownloadMeta>
  /** Called right after POST /download returns, under the download's real id. */
  record: (downloadId: string, meta: DownloadMetaInput) => void
}

/**
 * A localStorage cache of metadata the live feed and /downloads/all cannot carry - artwork,
 * artist, album - keyed by download id, so the Downloads page can enrich the server's rows with
 * it. It has no opinion about which rows exist or what stage they're in; the server answers both
 * now, and this hook only remembers what the server's feed never had in the first place.
 */
export function useDownloadLibrary(): DownloadLibrary {
  const [metas, setMetas] = useState<Record<string, DownloadMeta>>(loadMetas)

  useEffect(() => {
    const handle = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          v: STORAGE_VERSION,
          savedAt: Date.now(),
          metas: Object.values(metas),
        } satisfies LibrarySnapshot))
      } catch {
        // best effort - private mode / storage disabled just means no history
      }
    }, SAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [metas])

  const record = useCallback((downloadId: string, meta: DownloadMetaInput) => {
    const requestedAt = new Date().toISOString()
    setMetas(prev => evictToCap({
      ...prev,
      [downloadId]: {
        ...meta,
        downloadId,
        requestedAt: prev[downloadId]?.requestedAt ?? requestedAt,
      },
    }))
  }, [])

  return { metas, record }
}
