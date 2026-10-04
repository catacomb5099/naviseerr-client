import type { DownloadReply, DownloadRequest } from './background'
import { Kind, Target, targetFromHref } from './links'

/**
 * Runs inside music.youtube.com. Puts a Naviseerr download button on everything that can be
 * downloaded: song rows (search, album and playlist track lists, artist pages), album and playlist
 * rows and cards, the album or playlist page header, and the song playing in the player bar.
 *
 * YouTube Music is a single-page app that reuses its row elements as you move around, so this does
 * not mark a row "done": every pass works out what each row points at now and fixes the button if
 * the row has moved on to another song. Only this file's own `nvs-` elements are ever touched.
 */

const NOUN: Record<Kind, string> = { SONG: 'song', ALBUM: 'album', PLAYLIST: 'playlist' }

/** A row or card: its song link wins (a song row also links its album and artist), else its own
 *  main link, which for an album or playlist row is the first one. */
function targetOf(el: Element): Target | null {
  const song = el.querySelector('a[href^="watch?"]')
  if (song) return targetFromHref(song.getAttribute('href'))
  return targetFromHref(el.querySelector('a[href]')?.getAttribute('href') ?? null)
}

/** The album or playlist this page is. Album pages show a `playlist?list=OLAK5uy_…` address, but
 *  Naviseerr wants the album's own id, which YouTube Music keeps in the page's history entry. If it
 *  is not there the album is downloaded as a playlist of its songs, which still gets every song. */
function pageTarget(): Target | null {
  const browseId: unknown = history.state?.command?.browseEndpoint?.browseId
  if (typeof browseId === 'string' && browseId.startsWith('MPREb_')) return { kind: 'ALBUM', id: browseId }
  return targetFromHref(location.pathname.slice(1) + location.search)
}

/** The song in the player bar. With the player open the page address names it; with the player
 *  closed, the video player's own title link does. Nothing while an advert plays: the player then
 *  shows the ad (and its title link names the ad a moment before the bar says it is one). */
function playingTarget(bar: Element): Target | null {
  if (bar.hasAttribute('is-advertisement')) return null
  if (location.pathname === '/watch') return targetFromHref(location.pathname + location.search)
  return targetFromHref(document.querySelector('#movie_player .ytp-title-link')?.getAttribute('href') ?? null)
}

const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
const ALERT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v6m0 4h.01" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>'

type State = 'idle' | 'busy' | 'done' | 'error'

const WORDS: Record<State, (noun: string) => string> = {
  idle: noun => `Download this ${noun} with Naviseerr`,
  busy: () => 'Asking Naviseerr…',
  done: () => 'Sent to Naviseerr: open the extension to watch it',
  error: () => 'Could not reach Naviseerr',
}
const SHORT: Record<State, (noun: string) => string> = {
  idle: noun => `Download ${noun}`, busy: () => 'Sending…', done: () => 'Sent to Naviseerr', error: () => 'Try again',
}

function paint(button: HTMLButtonElement, state: State, message?: string) {
  const noun = NOUN[button.dataset.kind as Kind]
  const words = message ?? WORDS[state](noun)
  button.dataset.state = state
  button.disabled = state === 'busy'
  button.title = words
  button.setAttribute('aria-label', words)
  button.innerHTML = (state === 'done' ? CHECK : state === 'error' ? ALERT : ARROW)
    + (button.dataset.label === 'full' ? `<span>${SHORT[state](noun)}</span>` : '')
}

/** One button per place. Only a click's own default and bubbling are stopped: the rows put a link
 *  over themselves, and a click on the button must not also play or open what is under it. */
function makeButton(where: string, full = false): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `nvs-dl nvs-dl--${where}`
  if (full) button.dataset.label = 'full'
  for (const type of ['mousedown', 'pointerdown', 'touchstart'] as const) {
    button.addEventListener(type, e => e.stopPropagation())
  }
  button.addEventListener('click', async e => {
    e.preventDefault()
    e.stopPropagation()
    if (button.dataset.state === 'busy') return
    const { kind, id } = button.dataset as { kind: Kind; id: string }
    paint(button, 'busy')
    let reply: DownloadReply
    try {
      reply = await chrome.runtime.sendMessage({ type: 'download', kind, id } satisfies DownloadRequest)
    } catch {
      // The extension was reloaded or updated under this tab; only a page reload reconnects it.
      reply = { ok: false, error: 'The extension was updated: reload this page' }
    }
    // The row may have moved on to another song while the server answered.
    if (button.dataset.id !== id) return
    if (reply.ok) paint(button, 'done')
    else paint(button, 'error', reply.error)
  })
  return button
}

/** Puts `button` (made by `make`) where `place` says, pointed at `target`; removes it when there is
 *  nothing to download. A button already pointing at the same thing keeps its state ("Sent"). */
function sync(host: Element, target: Target | null, make: () => HTMLButtonElement, place: (b: HTMLButtonElement) => void) {
  const existing = host.querySelector<HTMLButtonElement>(':scope .nvs-dl')
  if (!target) {
    existing?.remove()
    return
  }
  const button = existing ?? make()
  if (button.dataset.id !== target.id || button.dataset.kind !== target.kind) {
    button.dataset.id = target.id
    button.dataset.kind = target.kind
    paint(button, 'idle')
  }
  if (!existing) place(button)
}

function scan() {
  // Rows: search results, track lists, artist pages, the library. Not the search box's suggestions.
  for (const row of document.querySelectorAll('ytmusic-responsive-list-item-renderer:not(ytmusic-search-suggestions-section *)')) {
    sync(row, targetOf(row), () => makeButton('row'), b => {
      const menu = row.querySelector(':scope > ytmusic-menu-renderer, ytmusic-menu-renderer')
      if (menu) menu.before(b)
      else row.append(b)
    })
  }
  // Cards: album, playlist and video tiles on Home, Explore and artist pages.
  for (const card of document.querySelectorAll('ytmusic-two-row-item-renderer')) {
    const art = card.querySelector('.image-wrapper') ?? card
    sync(art, targetOf(card), () => makeButton('card'), b => art.append(b))
  }
  // The album or playlist page itself: a labelled button beside "Save to library". YouTube Music keeps
  // pages you left in the document, hidden; only the one on screen gets a button.
  const onCollection = location.pathname === '/playlist' || location.pathname.startsWith('/browse/MPREb_')
  for (const header of document.querySelectorAll<HTMLElement>('ytmusic-responsive-header-renderer')) {
    const actions = header.querySelector('#action-buttons')
    if (!actions) continue
    sync(actions, onCollection && header.offsetParent !== null ? pageTarget() : null,
      () => makeButton('header', true), b => actions.prepend(b))
  }
  // The song playing now, beside the like buttons in the player bar.
  const bar = document.querySelector('ytmusic-player-bar')
  const slot = bar?.querySelector('.middle-controls-buttons') ?? bar?.querySelector('.right-controls-buttons')
  if (bar && slot) sync(slot, playingTarget(bar), () => makeButton('bar'), b => slot.append(b))
}

// YouTube Music changes its page constantly (progress bar, lazy rows); one pass per animation
// frame at most is plenty and costs a few milliseconds even on a 500-song playlist.
let queued = false
new MutationObserver(() => {
  if (queued) return
  queued = true
  requestAnimationFrame(() => { queued = false; scan() })
}).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'is-advertisement'] })
scan()
