import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { PageNavButton } from '../components/PageNavButton'
import { DownloadRow } from '../components/DownloadRow'
import { ManualImportDialog } from '../components/ManualImportDialog'
import { DownloadFilter, DownloadFilterPills } from '../components/DownloadFilterPills'
import { Button } from '../components/ui/button'
import { useAllDownloads } from '../hooks/useAllDownloads'
import { ManualImportTarget } from '../hooks/useCandidates'
import { DownloadMeta, pageItems, parseTypeFilter } from '../lib/downloadLibrary'
import { DownloadCardState } from '../lib/downloadPanel'

interface DownloadsPageProps {
  metas: Record<string, DownloadMeta>
  cards: DownloadCardState[]
  /** Drives the live progress bar's transition duration, same as the panel's cards. */
  pollIntervalMs: number
  onCancel: (id: string, taskId?: string) => void
  onRetry: (id: string, taskId?: string) => void | Promise<void>
  inFlight: Set<string>
  onNavigateHome: () => void
}

/** Anything that isn't a safe integer >= 1 becomes page 1 - a hand-typed or stale `?page=` should
 *  land somewhere real rather than feed a nonsense value to the fetch. `isSafeInteger`, not
 *  `isInteger`: `Number('1e21')` is an integer and would round-trip into the URL as `1e+21`. */
function parsePageNumber(raw: string | null): number {
  const n = Number(raw)
  return Number.isSafeInteger(n) && n >= 1 ? n : 1
}

const PAGE_BUTTON_CLASS =
  'border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white'

/** All is the absence of `type`, the way page 1 is what a missing `page` means; `page` is written
 *  every time so the pills, the paging buttons and the redirect all produce the same URL shape. */
function paramsFor(filter: DownloadFilter, page: number): Record<string, string> {
  return filter === 'all' ? { page: String(page) } : { type: filter, page: String(page) }
}

const EMPTY_BY_FILTER: Record<DownloadFilter, string> = {
  all: 'Nothing downloaded yet — search for a song and hit the download button',
  SONG: 'No songs downloaded yet',
  ALBUM: 'No albums downloaded yet',
  PLAYLIST: 'No playlists downloaded yet',
}

export function DownloadsPage({ metas, cards, pollIntervalMs, onCancel, onRetry, inFlight, onNavigateHome }: DownloadsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const pageNumber = parsePageNumber(searchParams.get('page'))
  // The pill lives in the URL next to the page, so a filtered page can be linked to and comes back
  // on Back; the server pages within the type, so the two travel together as one fetch key.
  const type = parseTypeFilter(searchParams.get('type'))
  const filter: DownloadFilter = type ?? 'all'
  // A download requested from the search page reaches `cards` first; refetching when the SET of
  // live ids changes brings it onto this page without a reload. Sorted, so a change in the cards'
  // order alone is not a change worth a request.
  const liveIds = cards.map(card => card.downloadId).sort().join(',')
  const { rows, totalPages, loaded, error, refresh } = useAllDownloads(pageNumber, { type, refreshKey: liveIds })
  const items = pageItems(rows, metas, cards)
  // Whether `rows` are the ones the URL asks for - same page AND same pill.
  const isCurrent = loaded?.pageNumber === pageNumber && loaded?.type === type

  // Keyed on `loaded` rather than a bare "no rows" check: `rows` also reads empty on the very
  // first render, before any fetch has resolved, and a bare check would redirect a legitimate deep
  // link to page 2 straight back to page 1 before it ever got a chance to load. Requiring the
  // fetch that resolved to be for THIS page and pill is what lets "no rows yet" and "this page
  // really is empty" be told apart. Uses `replace` so the bogus page doesn't linger in history -
  // otherwise the back button would land back on it and clamp forward again.
  useEffect(() => {
    if (isCurrent && rows.length === 0 && pageNumber > 1) {
      setSearchParams(paramsFor(filter, 1), { replace: true })
    }
  }, [isCurrent, rows.length, pageNumber, filter, setSearchParams])

  const goToPage = (page: number) => setSearchParams(paramsFor(filter, page))
  // The "choose a file" pop-up belongs to a row on this page, so the page holds which one is open.
  const [manual, setManual] = useState<ManualImportTarget | null>(null)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:px-6">
      <AppHeader action={
        <PageNavButton label="Search" icon={<ArrowLeft className="w-4 h-4" />} onClick={onNavigateHome} />
      } />

      <main className="space-y-12">
        <section>
          <h2 className="text-3xl font-bold text-white mb-6">Downloads</h2>

          <div className="mb-4">
            {/* A new pill starts at its own page 1: page 3 of albums is nowhere in particular among songs.
                The active pill is left alone, or every re-click would push a duplicate history entry. */}
            <DownloadFilterPills
              selected={filter}
              onSelect={next => { if (next !== filter) setSearchParams(paramsFor(next, 1)) }}
            />
          </div>

          {/* `rows` belong to `loaded`; until that matches the page and pill in the URL, what's on
              screen is another page's rows (or none yet), so it reads as loading. Error goes first
              so a failed page fetch can't leave that state spinning forever - the hook keeps the
              old rows on failure, so a `rows.length === 0` guard would never let the error show. */}
          {error ? (
            <div className="text-center py-20">
              <p className="text-red-500 text-lg mb-4">{error}</p>
              <Button variant="outline" onClick={refresh} className={PAGE_BUTTON_CLASS}>
                Retry
              </Button>
            </div>
          ) : !isCurrent ? (
            <div className="text-center py-20">
              <p className="text-zinc-500 text-lg">Loading downloads…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-500 text-lg">{EMPTY_BY_FILTER[filter]}</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {items.map(item => (
                <DownloadRow
                  key={item.downloadId}
                  item={item}
                  pollIntervalMs={pollIntervalMs}
                  onCancel={onCancel}
                  onRetry={onRetry}
                  onManualImport={setManual}
                  inFlight={inFlight}
                />
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

      <ManualImportDialog target={manual} onClose={() => setManual(null)} />
    </div>
  )
}
