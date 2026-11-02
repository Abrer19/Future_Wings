import { useState } from 'react'
import { ArrowRightIcon, CloseIcon, TrophyIcon } from './icons.jsx'

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.sessionStorage.getItem('futurewings.announcement_dismissed') === 'true'
  })

  const dismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('futurewings.announcement_dismissed', 'true')
    }
  }

  if (dismissed) return null

  return (
    <aside
      aria-label="Product announcement"
      className="relative z-50 bg-gradient-to-r from-secondary-950 via-indigo-950 to-secondary-900 px-4 py-2 text-white shadow-inner transition-all duration-300"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex flex-1 items-center justify-center gap-2 text-center sm:gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/30">
            <TrophyIcon className="h-3.5 w-3.5 text-amber-300" />
            Azure AI 2026
          </span>
          <span className="font-medium text-secondary-100">
            <strong className="font-semibold text-white">Built for the Global AI & SaaS Buildathon:</strong>{' '}
            Experience unified admissions, visa readiness, and scholarship intelligence.
          </span>
          <a
            className="hidden items-center gap-1 font-bold text-primary-300 transition hover:text-white sm:inline-flex"
            href="#product"
          >
            <span>Explore Architecture</span>
            <ArrowRightIcon className="h-3 w-3" />
          </a>
        </div>

        <button
          aria-label="Dismiss announcement"
          className="shrink-0 rounded-md p-1 text-secondary-400 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
          onClick={dismiss}
          type="button"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}
