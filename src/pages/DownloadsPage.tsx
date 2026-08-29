import { ArrowLeft } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { PageNavButton } from '../components/PageNavButton'
import { DownloadRow } from '../components/DownloadRow'
import { DownloadItem } from '../lib/downloadLibrary'

interface DownloadsPageProps {
  items: DownloadItem[]
  /** Drives the live progress bar's transition duration, same as the panel's cards. */
  pollIntervalMs: number
  onNavigateHome: () => void
  onRemove: (downloadId: string) => void
}

export function DownloadsPage({ items, pollIntervalMs, onNavigateHome, onRemove }: DownloadsPageProps) {
  const visibleItems = items

  const emptyCopy = items.length > 0
    ? 'No downloads match that'
    : 'Nothing downloaded yet — search for a song and hit the download button'

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
      <AppHeader action={
        <PageNavButton label="Search" icon={<ArrowLeft className="w-4 h-4" />} onClick={onNavigateHome} />
      } />

      <main className="space-y-12">
        <section>
          <h2 className="text-3xl font-bold text-white mb-6">Downloads</h2>

          {/* CONTROLS SLOT - bullets 3 and 4 insert the search bar and pills here. */}

          {visibleItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-500 text-lg">{emptyCopy}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleItems.map(item => (
                <DownloadRow
                  key={item.downloadId}
                  item={item}
                  pollIntervalMs={pollIntervalMs}
                  onRemove={() => onRemove(item.downloadId)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
