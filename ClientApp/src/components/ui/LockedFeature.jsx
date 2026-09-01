import { BTN_PRIMARY, CARD } from './styles.js'

/**
 * Shown in place of a page the current plan does not include.
 *
 * This is a UX gate, not a security boundary — the real enforcement for any feature
 * with server data must live behind its API endpoint.
 */
export default function LockedFeature({ page, requiredTier, onUpgrade }) {
  return (
    <div className="mx-auto max-w-xl">
      <div className={`px-6 py-12 text-center ${CARD}`}>
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
            <rect height="10" rx="2" width="14" x="5" y="11" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <h1 className="mt-4 text-xl font-bold text-secondary-950">{page} is part of {requiredTier}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-secondary-500">
          Upgrade your plan to unlock it. Everything you already use stays exactly as it is.
        </p>
        <button className={`mt-6 ${BTN_PRIMARY}`} onClick={onUpgrade} type="button">
          See plans
        </button>
      </div>
    </div>
  )
}
