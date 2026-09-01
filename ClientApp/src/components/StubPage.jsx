import { CARD } from './ui/styles.js'

/**
 * Placeholder for a module that isn't built yet.
 *
 * Deliberately reads as an unfinished product area, not as a developer TODO — the
 * previous version told students "This module is ready for API integration", which is
 * internal language leaking into the product.
 *
 * Uses the shared card and radius scale so an unbuilt page still looks like the rest
 * of the app rather than a different product.
 */
export default function StubPage({ title, description, action, onNavigate }) {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">FutureWings</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-secondary-950">{title}</h1>
        <p className="mt-2 max-w-2xl text-secondary-500">{description}</p>
      </header>

      <section className={`px-6 py-14 text-center ${CARD}`}>
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100 text-secondary-500">
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.4V12l3 1.8" />
          </svg>
        </span>

        <h2 className="mt-4 text-lg font-bold text-secondary-950">{action ?? 'In development'}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-secondary-500">
          We&rsquo;re still building this part of FutureWings. In the meantime, the tools below are
          ready to use.
        </p>

        {onNavigate && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {[
              { label: 'Track deadlines', page: 'Dashboard' },
              { label: 'Find programs', page: 'Discovery' },
              { label: 'Complete your profile', page: 'Profile' },
            ].map((link) => (
              <button
                className="rounded-lg border border-secondary-200 px-3.5 py-2 text-sm font-semibold text-secondary-700 transition hover:border-primary-500/40 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                key={link.page}
                onClick={() => onNavigate(link.page)}
                type="button"
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
