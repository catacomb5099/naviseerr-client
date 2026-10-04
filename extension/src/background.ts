import { getServerUrl } from './settings'

/** What the YouTube Music page asks for. The page cannot call the server itself: YouTube's own
 *  security rules would stop a request from music.youtube.com to a server on this machine, so the
 *  page hands the request to this background worker, which may talk to the server. */
export interface DownloadRequest {
  type: 'download'
  kind: 'SONG' | 'ALBUM' | 'PLAYLIST'
  id: string
}

export type DownloadReply = { ok: true } | { ok: false; error: string }

async function requestDownload({ kind, id }: DownloadRequest): Promise<DownloadReply> {
  const server = await getServerUrl()
  const path = kind === 'SONG'
    ? `/download/song/${encodeURIComponent(id)}`
    : `/download/collection/${encodeURIComponent(id)}?type=${kind}`
  try {
    const response = await fetch(server + path, { method: 'POST' })
    return response.ok ? { ok: true } : { ok: false, error: `Naviseerr turned it down (${response.status})` }
  } catch {
    return { ok: false, error: `Naviseerr is not answering at ${server}. Open the extension to change the address.` }
  }
}

chrome.runtime.onMessage.addListener((message: DownloadRequest, _sender, reply) => {
  if (message?.type !== 'download') return false
  void requestDownload(message).then(reply)
  return true   // the reply comes later
})
