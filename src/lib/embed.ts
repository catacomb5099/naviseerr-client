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

/** The Feishin page this app is shown in, or null when opened on its own. Read once as the app
 *  starts: `from` is on the first address only and the app's own search soon replaces it. Kept for
 *  the tab too, so a reload inside the frame still knows it. */
function readParent(): string | null {
  let from = new URLSearchParams(window.location.search).get('from')
  try {
    if (from) sessionStorage.setItem(STORAGE_KEY, from)
    else from = sessionStorage.getItem(STORAGE_KEY)
  } catch {
    // storage off: this page load still knows from its own address
  }
  return frameParent(from, window.self !== window.top)
}

const parentPage = typeof window === 'undefined' ? null : readParent()

export function embeddedIn(): string | null {
  return parentPage
}

/** Where "Continue with Authentik" comes back to: the Feishin page around this app, else this page.
 *  The sign-in itself opens at the top (`target="_top"`): Authentik's page refuses to be framed. */
export function returnTo(): string {
  return embeddedIn() ?? window.location.href
}

const ANSWER_WAIT_MS = 1500
let asked = 0

/** Asks the Feishin around this app to play the song from its own library. True when it did; false
 *  when it does not have the song, does not answer in 1.5 s (a Feishin without this bridge), or the
 *  app is not inside one. Messages go to Feishin's origin only, and only its answers count. */
export function playInParent(title: string, artists: string[]): Promise<boolean> {
  const page = embeddedIn()
  if (!page) return Promise.resolve(false)
  const origin = new URL(page).origin
  const id = String(++asked)
  return new Promise(resolve => {
    const done = (played: boolean) => {
      window.removeEventListener('message', onMessage)
      window.clearTimeout(timer)
      resolve(played)
    }
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin || event.source !== window.parent) return
      if (event.data?.type === 'naviseerr:played' && event.data.id === id) done(event.data.played === true)
    }
    const timer = window.setTimeout(() => done(false), ANSWER_WAIT_MS)
    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: 'naviseerr:play', id, title, artists }, origin)
  })
}
