import { ReactNode } from 'react'
import { Button } from './ui/button'

interface PageNavButtonProps {
  label: string
  icon: ReactNode
  onClick: () => void
}

/** One nav control used in both directions, so Home->Downloads and Downloads->Home cannot drift. Icon only on
 *  phones, like Log out, so the header's icons fit a 375 px screen (the label stays for screen readers). */
export function PageNavButton({ label, icon, onClick }: PageNavButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      aria-label={label}
      className="h-11 sm:h-10 flex-none bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}
