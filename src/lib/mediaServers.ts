/**
 * The music-app step (Settings → Music app, and the first-run setup's second screen): what "Save and
 * test" needs before it may be pressed, and the lines the saved state and the done screen read. Pure,
 * so scripts/check-media-servers.ts can pin them.
 */
import type { MediaServerKind, MediaServerStatus, MediaServersSettings } from '../api/types'

export const MEDIA_SERVER_NAME: Record<MediaServerKind, string> = { navidrome: 'Navidrome', jellyfin: 'Jellyfin' }

/** The install-file lines that set each app, named in the grey note when they are the source. */
export const MEDIA_SERVER_ENV: Record<MediaServerKind, string> = {
  navidrome: 'NAVIDROME_URL, NAVIDROME_USER, NAVIDROME_PASSWORD',
  jellyfin: 'JELLYFIN_URL, JELLYFIN_API_KEY',
}

/** An http(s) address, the login (Navidrome needs an admin username), and a secret unless one is already stored. */
export function canSaveMediaServer(kind: MediaServerKind, url: string, login: string, secret: string, secretSet: boolean): boolean {
  if (!/^https?:\/\/\S+$/.test(url.trim())) return false
  if (kind === 'navidrome' && login.trim() === '') return false
  return secret !== '' || secretSet
}

/** "Navidrome at http://…: connected." from the server's last outcome for that app; before the first check, says so. */
export function mediaServerStatusCopy(kind: MediaServerKind, url: string, status: MediaServerStatus | undefined): string {
  const name = MEDIA_SERVER_NAME[kind]
  if (!status) return `${name} at ${url}: not checked yet.`
  return status.problem ? `${name} at ${url}: ${status.problem}` : `${name} at ${url}: connected.`
}

/** The done screen's line: the app(s) naviseerr will ask to rescan, or that none was chosen. */
export function musicAppSummary(settings: MediaServersSettings): string {
  const apps = (['navidrome', 'jellyfin'] as const).flatMap(kind => {
    const s = settings[kind]
    return s ? [`${MEDIA_SERVER_NAME[kind]} at ${s.url}${s.fromInstallFile ? ' (from the install file)' : ''}`] : []
  })
  return apps.length ? `Music app: ${apps.join(', ')}.` : 'Music app: none; your app finds new files on its own schedule.'
}
