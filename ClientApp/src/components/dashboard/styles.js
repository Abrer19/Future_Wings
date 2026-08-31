/**
 * The one radius + shadow scale for the Dashboard.
 *
 * The app currently mixes four radii (md/lg/xl/2xl) and inconsistent shadows with no
 * shared meaning. Within this page there are exactly three radius roles and two
 * elevations, and nothing is allowed to invent a fourth.
 *
 *   RADIUS   container -> rounded-2xl   control -> rounded-lg   pill -> rounded-full
 *   ELEVATION resting  -> SHADOW_CARD   floating -> SHADOW_FLOAT
 *
 * These are full literal class strings on purpose: Tailwind only emits arbitrary
 * values it can read verbatim in source, so they must never be built by interpolation.
 */

// Resting elevation: a hairline contact shadow plus a soft ambient one. Two layers
// read as "lifted paper"; a single large blur reads as a generic drop shadow.
export const SHADOW_CARD =
  'shadow-[0_1px_2px_rgba(27,36,50,0.04),0_6px_20px_-8px_rgba(27,36,50,0.10)]'

// Floating elevation, used only for the toast — the one thing that sits above the page.
export const SHADOW_FLOAT = 'shadow-[0_12px_32px_-8px_rgba(27,36,50,0.24)]'

export const CARD = `rounded-2xl border border-secondary-200/70 bg-white ${SHADOW_CARD}`

export const CONTROL =
  'rounded-lg border border-secondary-200 bg-white px-3 py-2.5 text-sm text-secondary-950 outline-none transition placeholder:text-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'

export const FOCUS =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'

export const BTN_PRIMARY =
  `inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`

export const BTN_QUIET =
  `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-secondary-500 sm:min-h-8 transition hover:bg-secondary-100 hover:text-secondary-800 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`
