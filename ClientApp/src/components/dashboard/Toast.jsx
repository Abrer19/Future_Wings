import { SHADOW_FLOAT } from './styles.js'
import { CheckIcon } from './icons.jsx'

/**
 * Success confirmation for the four mutations.
 *
 * The wrapper is always mounted and always `aria-live="polite"`, which is what makes
 * list changes audible to screen reader users — a live region added at the same moment
 * its content appears is unreliably announced.
 *
 * Keep the region in the DOM; toggle only its contents.
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
            <CheckIcon />
          </span>
          <p className="text-sm font-medium text-secondary-950">{message}</p>
        </div>
      )}
    </div>
  )
}
