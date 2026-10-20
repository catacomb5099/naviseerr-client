import { ReactNode } from 'react'

/**
 * The one centred card the login screen is (Navidrome's and Jellyfin's first screens have the same
 * shape: the product name, a short title, one thing to do). Phone-first by construction: a single
 * column that fills the width up to 24 rem.
 */
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 md:p-8">
        <p className="text-3xl font-bold mb-1">
          <span className="bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">Naviseerr</span>
        </p>
        <h1 className="text-lg font-semibold text-zinc-200 mb-6">{title}</h1>
        {children}
      </div>
    </main>
  )
}
