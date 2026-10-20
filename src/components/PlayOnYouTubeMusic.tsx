import { Play } from 'lucide-react'
import { embeddedIn, playInParent } from '../lib/embed'
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
 *  YouTube Music search instead, and says so. Inside Feishin it asks Feishin first: a song already in
 *  your library plays in Feishin's player, anything else opens YouTube Music as before. */
export function PlayOnYouTubeMusic({ videoId, title, artists, className = '' }: PlayOnYouTubeMusicProps) {
  const href = songLink(videoId, title, artists)
  if (!href) return null
  const found = href.includes('/watch?')
  const name = title || 'this song'
  const inFeishin = Boolean(title && embeddedIn())
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={inFeishin ? 'Play' : found ? 'Play on YouTube Music' : 'Find on YouTube Music'}
      aria-label={inFeishin ? `Play ${name}` : found ? `Play ${name} on YouTube Music` : `Find ${name} on YouTube Music`}
      onClick={e => {
        e.stopPropagation()
        if (!inFeishin || !title) return
        e.preventDefault()
        // The click still counts as the listener's for the browser's pop-up rule while Feishin answers.
        void playInParent(title, artists).then(played => {
          if (!played) window.open(href, '_blank', 'noopener,noreferrer')
        })
      }}
      className={`inline-flex h-10 w-10 sm:h-8 sm:w-8 flex-none items-center justify-center rounded-full text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${className}`}
    >
      <Play className="w-4 h-4" aria-hidden="true" />
    </a>
  )
}
