import { createContext, useContext } from 'react'
import { DownloadType } from '../api/types'
import { DownloadCardState, itemDownload, itemDownloadLabel } from '../lib/downloadPanel'

/** The polled download feed, provided once by App so any download button can read it without the
 *  cards being handed down through every page and card in between. */
export const DownloadCardsContext = createContext<DownloadCardState[]>([])

export function useDownloadCards(): DownloadCardState[] {
  return useContext(DownloadCardsContext)
}

/** One item's state for its download button: the card that counts and the words to show instead of
 *  "Download" (null = askable). See `itemDownload` / `itemDownloadLabel`. */
export function useItemDownload(type: DownloadType, id: string): { card: DownloadCardState | undefined; label: string | null } {
  const card = itemDownload(useDownloadCards(), type, id)
  return { card, label: itemDownloadLabel(card) }
}
