import { useState } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Track } from '../api/types'
import { Download } from 'lucide-react'

interface SongCardProps {
  track: Track
  artistNames: string[]
  onDownload: (songName: string) => void
}

export function SongCard({ track, artistNames, onDownload }: SongCardProps) {
  const [iconFailed, setIconFailed] = useState(false)

  const handleDownload = () => {
    const displayName = artistNames.length > 0
      ? `${track.name} - ${artistNames[0]}`
      : track.name
    onDownload(displayName)
  }

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
            {artistNames.length > 0 ? artistNames.join(', ') : 'Unknown Artist'}
          </p>
        </div>

        {/* Download Button */}
        <Button
          onClick={handleDownload}
          size="sm"
          className="flex-shrink-0 bg-green-600 hover:bg-green-500 text-white"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}
