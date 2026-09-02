import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
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

/** Anything that isn't an integer >= 1 becomes page 1 - a hand-typed or stale `?page=` should land
 *  somewhere real rather than feed a nonsense value to the fetch. */
function parsePageNumber(raw: string | null): number {
  const n = Number(raw)
  return Number.isInteger(n) && n >= 1 ? n : 1
}

const PAGE_BUTTON_CLASS =
  'border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white'

export function DownloadsPage({ metas, cards, pollIntervalMs, onNavigateHome }: DownloadsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const pageNumber = parsePageNumber(searchParams.get('page'))
  const { rows, totalPages, loadedPage, loading, error, refresh } = useAllDownloads(pageNumber)
  const items = pageItems(rows, metas, cards)

  // Keyed on `loadedPage` rather than a bare "no rows" check: `rows` also reads empty on the very
  // first render, before any fetch has resolved, and a bare check would redirect a legitimate deep
  // link to page 2 straight back to page 1 before it ever got a chance to load. Requiring the
  // fetch that resolved to be for THIS page is what lets "no rows yet" and "this page really is
  // empty" be told apart. Uses `replace` so the bogus page doesn't linger in history - otherwise
  // the back button would land back on it and clamp forward again.
  useEffect(() => {
    if (loadedPage === pageNumber && rows.length === 0 && pageNumber > 1) {
      setSearchParams({ page: '1' }, { replace: true })
    }
  }, [loadedPage, rows.length, pageNumber, setSearchParams])

  const goToPage = (page: number) => setSearchParams({ page: String(page) })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
      <AppHeader action={
        <PageNavButton label="Search" icon={<ArrowLeft className="w-4 h-4" />} onClick={onNavigateHome} />
      } />

      <main className="space-y-12">
        <section>
          <h2 className="text-3xl font-bold text-white mb-6">Downloads</h2>

          {/* CONTROLS SLOT - bullets 3 and 4 insert the search bar and pills here. */}

          {error && rows.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-red-500 text-lg mb-4">{error}</p>
              <Button variant="outline" onClick={refresh} className={PAGE_BUTTON_CLASS}>
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                disabled={pageNumber <= 1}
                onClick={() => goToPage(pageNumber - 1)}
                className={PAGE_BUTTON_CLASS}
              >
                Previous
              </Button>
              <span className="text-sm text-zinc-400">Page {pageNumber} of {totalPages}</span>
              <Button
                variant="outline"
                disabled={pageNumber >= totalPages}
                onClick={() => goToPage(pageNumber + 1)}
                className={PAGE_BUTTON_CLASS}
              >
                Next
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
