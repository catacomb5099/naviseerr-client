import { Play } from 'lucide-react'
import { songLink } from '../lib/youtubeMusic'

interface PlayOnYouTubeMusicProps {
  videoId: string | null | undefined
  title: string | null | undefined
  artists: string[]
  className?: string
}

/** The Play button: a real link in a new tab, so naviseerr stays open behind the music and the
 *  browser counts the click as the listener's (its autoplay rules then decide if sound starts at
 *  once). `noreferrer` keeps the owner's server address from YouTube. With no videoId it opens a
 *  YouTube Music search instead, and says so. */
export function PlayOnYouTubeMusic({ videoId, title, artists, className = '' }: PlayOnYouTubeMusicProps) {
  const href = songLink(videoId, title, artists)
  if (!href) return null
  const found = href.includes('/watch?')
  const name = title || 'this song'
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={found ? 'Play on YouTube Music' : 'Find on YouTube Music'}
      aria-label={found ? `Play ${name} on YouTube Music` : `Find ${name} on YouTube Music`}
      onClick={e => e.stopPropagation()}
      className={`inline-flex h-8 w-8 flex-none items-center justify-center rounded-full text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${className}`}
    >
      <Play className="w-4 h-4" aria-hidden="true" />
    </a>
  )
}
