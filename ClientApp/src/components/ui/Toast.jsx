import { SHADOW_FLOAT } from './styles.js'

/**
 * Success confirmation used across pages.
 *
 * The wrapper is always mounted and always `aria-live="polite"` — a live region added
 * at the same moment its content appears is unreliably announced. Toggle only the
 * contents.
 */
export default function Toast({ message }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 sm:justify-end sm:pr-8"
      role="status"
    >
      {message && (
        <div
          className={`pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-secondary-200/70 bg-white py-3 pl-3 pr-4 ${SHADOW_FLOAT}`}
        >
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-500 text-white">
            <svg aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
              <path d="m5 12.5 4.5 4.5L19 7" />
            </svg>
          </span>
          <p className="text-sm font-medium text-secondary-950">{message}</p>
        </div>
      )}
    </div>
  )
}
