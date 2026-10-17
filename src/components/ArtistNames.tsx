import { Link } from 'react-router-dom'

/** Inline link styling only: no padding or border, so a name that becomes a link does not move
 *  anything around it. Underline on hover, a ring when reached by keyboard. */
export const ARTIST_LINK = 'pointer-events-auto hover:underline hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded'

interface ArtistNamesProps {
  names: string[]
  /** Index-aligned with `names`; a name whose id is null, or past the end of a shorter list (an older
   *  server, mock data), is plain text, never a dead link. */
  ids?: (string | null)[]
}

/** The artist line: a link to the artist's page for each name the server has an id for, plain text
 *  otherwise. Inline content only, so the parent's `truncate` still clips the whole line. */
export function ArtistNames({ names, ids = [] }: ArtistNamesProps) {
  if (names.length === 0) return <>Unknown Artist</>
  return (
    <>
      {names.map((name, i) => {
        const id = ids[i]
        return (
          <span key={i}>
            {i > 0 && ', '}
            {/* Some parents act on click (a Downloads collection row toggles); following a link must not also do that. */}
            {id
              ? <Link to={`/artist/${encodeURIComponent(id)}`} onClick={e => e.stopPropagation()} className={ARTIST_LINK}>{name}</Link>
              : name}
          </span>
        )
      })}
    </>
  )
}
