import { useState } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Track } from '../api/types'
import { Download, Info } from 'lucide-react'
import { PlayOnYouTubeMusic } from './PlayOnYouTubeMusic'
import { ArtistNames } from './ArtistNames'

interface SongCardProps {
  track: Track
  artistNames: string[]
  /** The server is asked for `track.id` (the YouTube videoId) and words the search itself; the
   *  resolved names come back with the track so the caller can record what was requested. */
  onDownload: (track: Track, artistNames: string[]) => void
  /** Opens the song info pop-up for `track.id`. */
  onInfo: (videoId: string, plays?: string | null) => void
}

export function SongCard({ track, artistNames, onDownload, onInfo }: SongCardProps) {
  const [iconFailed, setIconFailed] = useState(false)

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-colors">
      <div className="p-4 flex items-center gap-4">
        {/* Album Icon */}
        <div className="w-16 h-16 flex-shrink-0">
          {track.iconURL && !iconFailed ? (
            <img
              src={track.iconURL}
              alt={track.name}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded"
              onError={() => setIconFailed(true)}
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 rounded"></div>
          )}
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{track.name}</h3>
          <p className="text-sm text-zinc-400 truncate">
            <ArtistNames names={artistNames} ids={track.artistIds} />
          </p>
        </div>

        {/* YouTube Music's combined count, already in its wording ("7.2M plays"), like the album rows.
            Hidden on phones, where the card has no room for it. */}
        {track.plays && (
          <span className="hidden sm:inline text-xs text-zinc-400 tabular-nums whitespace-nowrap">
            {track.plays}
          </span>
        )}

        <PlayOnYouTubeMusic videoId={track.id} title={track.name} artists={artistNames} />

        <Button
          onClick={() => onInfo(track.id, track.plays)}
          variant="ghost"
          size="sm"
          aria-label={`Details for ${track.name}`}
          className="flex-shrink-0 px-2 text-zinc-400 hover:text-white hover:bg-white/10"
        >
          <Info className="w-4 h-4" />
        </Button>

        {/* Download Button */}
        <Button
          onClick={() => onDownload(track, artistNames)}
          size="sm"
          className="flex-shrink-0 bg-green-600 hover:bg-green-500 text-white"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}
