import { Fragment, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { PageNavButton } from '../components/PageNavButton'
import { DownloadRow } from '../components/DownloadRow'
import { DownloadFilterPills } from '../components/DownloadFilterPills'
import { FilterType } from '../components/FilterPills'
import { DownloadItem, DownloadGrouping, groupItems } from '../lib/downloadLibrary'

interface DownloadsPageProps {
  items: DownloadItem[]
  /** Drives the live progress bar's transition duration, same as the panel's cards. */
  pollIntervalMs: number
  onNavigateHome: () => void
  onRemove: (downloadId: string) => void
}

export function DownloadsPage({ items, pollIntervalMs, onNavigateHome, onRemove }: DownloadsPageProps) {
  const [pill, setPill] = useState<FilterType>('all')
  const visibleItems = items
  // Albums and Artists group the same rows; All and Songs leave them flat (every download is a
  // song, so Songs has nothing to exclude yet).
  const grouping: DownloadGrouping = pill === 'albums' ? 'album' : pill === 'artists' ? 'artist' : null
  const visibleGroups = groupItems(visibleItems, grouping)

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
          <div className="mb-4">
            <DownloadFilterPills selected={pill} onSelect={setPill} />
          </div>

          {visibleItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-500 text-lg">{emptyCopy}</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {visibleGroups.map(group => (
                <Fragment key={group.heading ?? '_flat'}>
                {group.heading !== null && (
                  <h3 className="text-xl font-semibold text-zinc-300 pt-4 first:pt-0">{group.heading}</h3>
                )}
                {group.items.map(item => (
                <DownloadRow
                  key={item.downloadId}
                  item={item}
                  pollIntervalMs={pollIntervalMs}
                  onRemove={() => onRemove(item.downloadId)}
                />
                ))}
                </Fragment>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
