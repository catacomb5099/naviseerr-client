/** Where the Naviseerr server is. Kept in Chrome's synced storage, so it follows the user's browser. */
export const DEFAULT_SERVER_URL = 'http://localhost:8080'

export async function getServerUrl(): Promise<string> {
  const { serverUrl } = await chrome.storage.sync.get('serverUrl')
  return typeof serverUrl === 'string' && serverUrl ? serverUrl : DEFAULT_SERVER_URL
}

/** Asks Chrome for access to a server that is not on this machine (it shows its own prompt), then
 *  saves the address. False when the address is not a web address or the user said no. */
export async function saveServerUrl(raw: string): Promise<boolean> {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  if (!local && !await chrome.permissions.request({ origins: [`${url.origin}/*`] })) return false
  await chrome.storage.sync.set({ serverUrl: (url.origin + url.pathname).replace(/\/+$/, '') })
  return true
}
