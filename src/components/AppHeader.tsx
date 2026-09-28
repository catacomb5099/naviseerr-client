import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AppHeaderProps {
  /** Rendered to the right of the title: the page-switch control. */
  action?: ReactNode
  /** Everything below the title row - the search bar and pills on Home, nothing on Downloads. */
  children?: ReactNode
}

export function AppHeader({ action, children }: AppHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-start justify-between gap-4 mb-4 md:mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">
          {/* The logo is the way home from every page; the ring sits on the link, not the clipped text. */}
          <Link
            to="/"
            className="inline-block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Naviseerr</span>
          </Link>
        </h1>
        {action}
      </div>
      {children}
    </header>
  )
}
