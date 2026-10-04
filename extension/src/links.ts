export type Kind = 'SONG' | 'ALBUM' | 'PLAYLIST'
export interface Target { kind: Kind; id: string }

/** What a YouTube Music link points at, if it is something Naviseerr can download. Album links are
 *  `browse/MPREb_…`, playlist links `browse/VL<id>` or `playlist?list=<id>`, songs `watch?v=<id>`.
 *  Artists, podcasts and YouTube's own pages are left alone. */
export function targetFromHref(href: string | null): Target | null {
  if (!href) return null
  const url = new URL(href, 'https://music.youtube.com/')
  if (url.pathname === '/watch') {
    const v = url.searchParams.get('v')
    return v ? { kind: 'SONG', id: v } : null
  }
  if (url.pathname.startsWith('/browse/')) {
    const id = url.pathname.slice('/browse/'.length)
    if (id.startsWith('MPREb_')) return { kind: 'ALBUM', id }
    if (id.startsWith('VL')) return { kind: 'PLAYLIST', id: id.slice(2) }
    return null
  }
  if (url.pathname === '/playlist') {
    const list = url.searchParams.get('list')
    return list ? { kind: 'PLAYLIST', id: list } : null
  }
  return null
}
