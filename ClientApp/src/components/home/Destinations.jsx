import SectionHeading from './SectionHeading.jsx'
import { ArrowRightIcon } from './icons.jsx'

const tierStyles = {
  'Tier 1': 'bg-primary-500/10 text-primary-500',
  'Tier 2': 'bg-warning/15 text-warning-700',
}

const destinations = [
  { name: 'United States', tier: 'Tier 1', description: 'Top-ranked universities worldwide' },
  { name: 'United Kingdom', tier: 'Tier 1', description: 'World-class education heritage' },
  { name: 'Canada', tier: 'Tier 1', description: 'Inclusive and affordable options' },
  { name: 'Germany', tier: 'Tier 2', description: 'Low-tuition STEM powerhouse' },
  { name: 'Australia', tier: 'Tier 1', description: 'High quality of life & research' },
  { name: 'Japan', tier: 'Tier 2', description: 'Innovation meets tradition' },
]

export default function Destinations({ onViewDestination }) {
  return (
    <section
      aria-labelledby="destinations-title"
      className="bg-surface py-20 sm:py-24"
      id="destinations"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          badge="Destinations"
          badgeClassName="bg-success/10 text-success"
          description="Explore top-rated countries chosen by thousands of students."
          id="destinations-title"
          title="Popular Destinations"
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map(({ name, tier, description }) => (
            <li
              className="rounded-2xl border border-secondary-500/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-500/30 hover:shadow-md"
              key={name}
            >
              <h3 className="text-base font-bold text-secondary-950">{name}</h3>
              <span
                className={`mt-2 inline-flex rounded-md px-2 py-0.5 text-[11px] font-bold ${tierStyles[tier]}`}
              >
                {tier}
              </span>
              <p className="mt-3 text-sm leading-6 text-secondary-500">{description}</p>
              <button
                className="mt-4 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-primary-500 transition hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                onClick={() => onViewDestination?.(name)}
                type="button"
              >
                View Details
                <span className="sr-only"> for {name}</span>
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
