import { AlertIcon, CheckCircleIcon, ClockIcon } from './icons.jsx'

const tones = {
  active: {
    Icon: ClockIcon,
    chip: 'bg-primary-50 text-primary-600 border border-primary-200',
    value: 'text-secondary-950',
    rail: 'bg-primary-500',
    gradient: 'from-primary-500/5 to-transparent',
  },
  overdue: {
    Icon: AlertIcon,
    chip: 'bg-danger-50 text-danger-600 border border-danger-200',
    value: 'text-danger-600',
    rail: 'bg-danger-500',
    gradient: 'from-danger-500/5 to-transparent',
  },
  completed: {
    Icon: CheckCircleIcon,
    chip: 'bg-success-50 text-success-600 border border-success-200',
    value: 'text-secondary-950',
    rail: 'bg-success-500',
    gradient: 'from-success-500/5 to-transparent',
  },
}

export default function StatCard({ tone, label, value, hint }) {
  const { Icon, chip, value: valueClass, rail, gradient } = tones[tone]
  const muted = value === 0

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-secondary-200/80 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-500/5">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 pointer-events-none`} />
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1.5 rounded-l-3xl transition ${muted ? 'bg-secondary-200' : rail}`}
      />
      <div className="flex items-start justify-between gap-3 pl-2 relative z-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">{label}</p>
          <p className={`mt-2 text-3xl sm:text-4xl font-black tabular-nums tracking-tight ${muted ? 'text-secondary-400' : valueClass}`}>
            {value}
          </p>
          <p className="mt-1.5 text-xs font-medium text-secondary-400">{hint}</p>
        </div>
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm transition group-hover:scale-105 ${
            muted ? 'bg-secondary-100 text-secondary-400 border border-secondary-200' : chip
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}
