import { ArrowLeft } from 'lucide-react'
import { AppHeader } from '../components/AppHeader'
import { PageNavButton } from '../components/PageNavButton'
import { DownloadRow } from '../components/DownloadRow'
import { Button } from '../components/ui/button'
import { useAllDownloads } from '../hooks/useAllDownloads'
import { DownloadMeta, pageItems } from '../lib/downloadLibrary'
import { DownloadCardState } from '../lib/downloadPanel'

interface DownloadsPageProps {
  metas: Record<string, DownloadMeta>
  cards: DownloadCardState[]
  /** Drives the live progress bar's transition duration, same as the panel's cards. */
  pollIntervalMs: number
  onNavigateHome: () => void
}

const RETRY_BUTTON_CLASS =
  'border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white'

export function DownloadsPage({ metas, cards, pollIntervalMs, onNavigateHome }: DownloadsPageProps) {
  const { rows, loading, error, refresh } = useAllDownloads()
  const items = pageItems(rows, metas, cards)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
      <AppHeader action={
        <PageNavButton label="Search" icon={<ArrowLeft className="w-4 h-4" />} onClick={onNavigateHome} />
      } />

      <main className="space-y-12">
        <section>
          <h2 className="text-3xl font-bold text-white mb-6">Downloads</h2>

          {error && rows.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-red-500 text-lg mb-4">{error}</p>
              <Button variant="outline" onClick={refresh} className={RETRY_BUTTON_CLASS}>
                Retry
              </Button>
            </div>
          ) : loading && rows.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-500 text-lg">Loading downloads…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-500 text-lg">
                Nothing downloaded yet — search for a song and hit the download button
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {items.map(item => (
                <DownloadRow key={item.downloadId} item={item} pollIntervalMs={pollIntervalMs} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
