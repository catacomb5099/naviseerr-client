import { createContext, useContext } from 'react'
import { DownloadType } from '../api/types'

/** What "Add to playlist" was pressed on: a song, or a whole album, playlist, suggested playlist, radio or
 *  one of your own playlists. `songs` are the songs the page already shows, for "Choose songs". */
export interface AddTarget {
  type: DownloadType
  id: string
  title: string
  songs?: { id: string; name: string }[]
}

/** Opens the one "Add to playlist" pop-up App owns, from any row or header, without passing it down. */
export const AddToPlaylistContext = createContext<(target: AddTarget) => void>(() => {})

export function useAddToPlaylist(): (target: AddTarget) => void {
  return useContext(AddToPlaylistContext)
}
