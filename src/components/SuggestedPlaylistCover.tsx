import { coverGradient } from '../lib/suggested'

interface SuggestedPlaylistCoverProps {
  category: string
  title: string
  className?: string
}

/** The generated cover: the title set on a colour field that is always the same for that category. Only
 *  phrasing content (span), so it can sit inside a card's link as well as in a page header. */
export function SuggestedPlaylistCover({ category, title, className = '' }: SuggestedPlaylistCoverProps) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundImage: coverGradient(category) }}
      className={`relative block overflow-hidden rounded shadow-lg [container-type:inline-size] ${className}`}
    >
      {/* A soft highlight so the field reads as a surface, not a flat swatch. */}
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.28),transparent_55%)]" />
      <span className="absolute inset-x-0 bottom-0 p-[9%] text-left font-bold leading-[1.05] tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] [font-size:clamp(0.9rem,15cqw,2rem)]">
        {title}
      </span>
    </span>
  )
}
