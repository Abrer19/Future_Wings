import { CARD } from './styles.js'
import { AlertIcon, CheckCircleIcon, ClockIcon } from './icons.jsx'

// Full literal class strings — Tailwind cannot see interpolated arbitrary values.
const tones = {
  active: {
    Icon: ClockIcon,
    chip: 'bg-primary-50 text-primary-600',
    value: 'text-secondary-950',
    rail: 'bg-primary-500',
  },
  overdue: {
    Icon: AlertIcon,
    chip: 'bg-danger-50 text-danger-600',
    value: 'text-danger-600',
    rail: 'bg-danger-500',
  },
  completed: {
    Icon: CheckCircleIcon,
    chip: 'bg-success-50 text-success-600',
    value: 'text-secondary-950',
    rail: 'bg-success-500',
  },
}

/**
 * A stat tile. The left rail is the only decoration and it encodes the metric's
 * identity, so it carries information rather than being ornament.
 *
 * `muted` drops the emphasis when the count is zero — an overdue card showing 0
 * should not shout in red.
 */
export default function StatCard({ tone, label, value, hint }) {
  const { Icon, chip, value: valueClass, rail } = tones[tone]
  const muted = value === 0

  return (
    <div className={`relative overflow-hidden p-5 ${CARD}`}>
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 ${muted ? 'bg-secondary-200' : rail}`}
      />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div>
          <p className="text-sm font-medium text-secondary-500">{label}</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums ${muted ? 'text-secondary-400' : valueClass}`}>
            {value}
          </p>
          <p className="mt-1 text-xs text-secondary-400">{hint}</p>
        </div>
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            muted ? 'bg-secondary-100 text-secondary-400' : chip
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}
