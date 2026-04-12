import { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Track } from '../api/types'
import { Download } from 'lucide-react'

interface SongCardProps {
  track: Track
  onDownload: (trackId: string) => void
  isDownloading: boolean
}

export function SongCard({ track, onDownload, isDownloading }: SongCardProps) {
  const [cooldown, setCooldown] = useState(false)

  useEffect(() => {
    if (isDownloading) {
      setCooldown(true)
      const timer = setTimeout(() => {
        setCooldown(false)
      }, 30000) // 30 seconds

      return () => clearTimeout(timer)
    }
  }, [isDownloading])

  const handleDownload = () => {
    if (!cooldown) {
      onDownload(track.name + " - " + track.artists[0])
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 transition-colors">
      <div className="p-4 flex items-center gap-4">
        {/* Album Icon */}
        <div className="w-16 h-16 flex-shrink-0">
          {track.iconURL ? (
            <img
              src={track.iconURL}
              alt={track.name}
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                e.currentTarget.src = ''
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full bg-zinc-800 rounded"></div>
          )}
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{track.name}</h3>
          <p className="text-sm text-zinc-400 truncate">
            {track.artists.length > 0 ? track.artists.join(', ') : 'Unknown Artist'}
          </p>
        </div>

        {/* Download Button */}
        <Button
          onClick={handleDownload}
          disabled={cooldown}
          size="sm"
          className={`
            flex-shrink-0
            ${cooldown
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-500 text-white'
            }
          `}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}
