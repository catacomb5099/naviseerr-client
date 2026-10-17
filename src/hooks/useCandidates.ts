import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import { getAlbumCandidates, getDownloadDetail, getSongCandidates } from '../api/endpoints'
import { AlbumCandidatesResponse, DownloadStage, SongCandidatesResponse } from '../api/types'

/** What the "choose a file" dialog was opened for: one song (a single-song download row knows no
 *  taskId - the page's rows are download-level - so it comes null and the hook looks it up), or a whole
 *  album (`stage` is the album row's, to know whether a pick replaces live transfers). */
export type ManualImportTarget =
  | { kind: 'SONG'; downloadId: string; taskId: string | null; title: string }
  | { kind: 'ALBUM'; downloadId: string; title: string; stage: DownloadStage }

export type CandidatesLoad =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; kind: 'SONG'; data: SongCandidatesResponse }
  | { status: 'ready'; kind: 'ALBUM'; data: AlbumCandidatesResponse }

/** How often the dialog asks again while the server says the search is still running. */
export const SEARCHING_POLL_MS = 3000

/** The server's own sentence for a failed call when it sent one (`{ message }`), else the error's. */
function messageOf(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: unknown } | undefined
    if (body && typeof body.message === 'string') return body.message
  }
  return "Couldn't load what Soulseek found."
}

/**
 * The candidate list for `target`: fetched fresh every time the dialog opens (never cached - the server
 * holds the cache), re-asked every few seconds while the song is still SEARCHING, and dropped when the
 * dialog closes. `refetch` is "Try again" and what a 409 on a pick calls.
 */
export function useCandidates(target: ManualImportTarget | null): { load: CandidatesLoad; refetch: () => void } {
  const [load, setLoad] = useState<CandidatesLoad>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const key = target ? `${target.kind}:${target.downloadId}:${target.kind === 'SONG' ? target.taskId ?? '' : ''}` : null

  useEffect(() => {
    if (!key || !target) return
    const controller = new AbortController()
    let timer: number | undefined
    setLoad({ status: 'loading' })
    const run = async () => {
      try {
        let next: CandidatesLoad
        if (target.kind === 'ALBUM') {
          next = { status: 'ready', kind: 'ALBUM', data: await getAlbumCandidates(target.downloadId, controller.signal) }
        } else {
          let taskId = target.taskId
          if (!taskId) {
            const detail = await getDownloadDetail(target.downloadId, controller.signal)
            taskId = detail.songs[0]?.taskId ?? null
            if (!taskId) throw new ApiError('no song yet', 404, 'Not Found', { message: 'The server has not started this song yet.' })
          }
          next = { status: 'ready', kind: 'SONG', data: await getSongCandidates(target.downloadId, taskId, controller.signal) }
        }
        if (controller.signal.aborted) return
        setLoad(next)
        if (next.data.status === 'SEARCHING') timer = window.setTimeout(run, SEARCHING_POLL_MS)
      } catch (err) {
        if (controller.signal.aborted) return
        setLoad({ status: 'error', message: messageOf(err) })
      }
    }
    void run()
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
    // `target` is identified by `key`; the object itself is rebuilt on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  const refetch = useCallback(() => setAttempt(a => a + 1), [])
  return { load, refetch }
}
