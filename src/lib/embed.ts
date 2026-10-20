/** Naviseerr shown inside another app's page: Feishin's Discover page frames this web app and adds
 *  `?from=<its own address>` (the owner's proxy strips the referrer between sites, so the app cannot
 *  learn it otherwise). The only file that may look at `window.top` / `window.parent`. */
const STORAGE_KEY = 'naviseerr.embeddedIn'

/** The page framing this app, from `from` when the app is framed; null when it is not, or `from`
 *  is not a web address. */
export function frameParent(from: string | null, framed: boolean): string | null {
  if (!framed || !from) return null
  try {
    const url = new URL(from)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

let parentPage: string | null | undefined

/** The Feishin page this app is shown in, or null when opened on its own. `from` is on the first
 *  address only, so it is kept for the tab: later pages and a reload inside the frame still know it. */
export function embeddedIn(): string | null {
  if (parentPage !== undefined) return parentPage
  let from = new URLSearchParams(window.location.search).get('from')
  try {
    if (from) sessionStorage.setItem(STORAGE_KEY, from)
    else from = sessionStorage.getItem(STORAGE_KEY)
  } catch {
    // storage off: this page load still knows from its own address
  }
  parentPage = frameParent(from, window.self !== window.top)
  return parentPage
}

/** Where "Continue with Authentik" comes back to: the Feishin page around this app, else this page.
 *  The sign-in itself opens at the top (`target="_top"`): Authentik's page refuses to be framed. */
export function returnTo(): string {
  return embeddedIn() ?? window.location.href
}
