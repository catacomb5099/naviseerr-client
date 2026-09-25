import { useCallback, useEffect, useState } from 'react'
import { DownloadMeta, DownloadMetaInput, evictToCap } from '../lib/downloadLibrary'

// v2: the persisted shape changed from `{meta, snapshot}` entries to bare metas, now that the
// server (not this registry) says which rows exist and what stage they're in. Unlike the panel's
// v1->v2 move, a v1 payload is migrated, not discarded: its `meta` half is artwork, artist and
// album that no endpoint can re-supply, so dropping it would be lost data, not a lost history list.
const STORAGE_KEY = 'naviseerr.downloadLibrary.v2'
const V1_STORAGE_KEY = 'naviseerr.downloadLibrary.v1'
const STORAGE_VERSION = 2
const SAVE_DEBOUNCE_MS = 300

interface LibrarySnapshot {
  v: number
  savedAt: number
  metas: DownloadMeta[]
}

/** v1's `entry.meta` is field-for-field the DownloadMeta v2 stores; only the stage snapshot went. */
interface LibrarySnapshotV1 {
  v: number
  entries: { meta: DownloadMeta }[]
}

function loadMetas(): Record<string, DownloadMeta> {
  try {
    let metas: DownloadMeta[] = []
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as LibrarySnapshot
      if (parsed.v === STORAGE_VERSION && Array.isArray(parsed.metas)) metas = parsed.metas
    } else {
      // No v2 payload yet: read v1 once. The save effect writes v2 on mount, so this path runs
      // only on the first load after the upgrade.
      const rawV1 = localStorage.getItem(V1_STORAGE_KEY)
      const parsed = rawV1 ? JSON.parse(rawV1) as LibrarySnapshotV1 : null
      if (parsed?.v === 1 && Array.isArray(parsed.entries)) metas = parsed.entries.map(e => e?.meta)
    }
    const result: Record<string, DownloadMeta> = {}
    for (const meta of metas) {
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
