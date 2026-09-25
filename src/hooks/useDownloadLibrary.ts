import { useCallback, useEffect, useState } from 'react'
import { DownloadMeta, DownloadMetaInput, evictToCap } from '../lib/downloadLibrary'

// v3: meta is keyed by YouTube id and type and carries a title instead of a songName. Older
// payloads are discarded rather than migrated: the server now carries title, artists and artwork
// for every download it has resolved, so all a v2 entry could add is the album name on rows that
// predate this version - not worth a migration.
const STORAGE_KEY = 'naviseerr.downloadLibrary.v3'
const STORAGE_VERSION = 3
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
  /** Called right after POST /download/... returns, under the download's real id. */
  record: (downloadId: string, meta: DownloadMetaInput) => void
}

/**
 * A localStorage cache of what the client knew when it clicked - title, artists, artwork, album -
 * keyed by download id. Its one job is to fill a Downloads row the server has not resolved yet
 * (title null while QUEUED); once the server has the metadata, the row reads it from there. It has
 * no opinion about which rows exist or what stage they're in: the server answers both.
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
