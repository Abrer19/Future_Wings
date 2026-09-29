import SectionHeading from './SectionHeading.jsx'
import { ArrowRightIcon } from './icons.jsx'

const destinations = [
  {
    name: 'United States',
    tier: 'Tier 1 Global Ivy',
    avgCost: '$25k – $55k/yr',
    workRights: 'OPT 1–3 Years',
    highlight: 'World-renowned research labs, Silicon Valley networks & STEM OPT.',
  },
  {
    name: 'United Kingdom',
    tier: 'Tier 1 Heritage',
    avgCost: '£14k – £32k/yr',
    workRights: '2-Yr Graduate Route',
    highlight: '1-Year accelerated Master’s programs and historic Russell Group universities.',
  },
  {
    name: 'Canada',
    tier: 'Tier 1 Immigration',
    avgCost: 'CAD $18k – $38k/yr',
    workRights: '3-Yr PGWP Available',
    highlight: 'Clear post-graduation work permits, welcoming culture, and top co-op programs.',
  },
  {
    name: 'Germany',
    tier: 'Tier 2 Low Tuition',
    avgCost: '€0 – €3k/yr',
    workRights: '18-Mo Job Seeker',
    highlight: 'Virtually zero tuition fees at world-class public technical universities (TU9).',
  },
  {
    name: 'Australia',
    tier: 'Tier 1 Quality of Life',
    avgCost: 'AUD $28k – $46k/yr',
    workRights: '2–4 Yr Post-Study',
    highlight: 'High minimum wages, Group of Eight prestige, and generous regional visa perks.',
  },
  {
    name: 'Japan',
    tier: 'Tier 2 High Tech',
    avgCost: '$5k – $15k/yr',
    workRights: 'Designated Visa Track',
    highlight: 'Generous MEXT government scholarships, cutting-edge robotics and AI engineering.',
  },
]

export default function Destinations({ onViewDestination }) {
  return (
    <section
      aria-labelledby="destinations-title"
      className="bg-white py-20 sm:py-28 relative"
      id="destinations"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          badge="Global Destinations"
          badgeClassName="bg-primary-100 text-primary-800"
          description="Explore high-demand destination countries with clear admission tracks and post-study opportunities."
          id="destinations-title"
          title="Top International Study Destinations"
        />

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map(({ name, tier, avgCost, workRights, highlight }) => (
            <li
              className="group rounded-3xl border border-secondary-200/80 bg-surface p-6 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-primary-300 hover:shadow-xl hover:bg-white flex flex-col justify-between"
              key={name}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-secondary-950 group-hover:text-primary-600 transition">
                    {name}
                  </h3>
                  <span className="rounded-lg bg-primary-50 border border-primary-200 px-2.5 py-0.5 text-[10px] font-bold text-primary-800">
                    {tier}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-semibold text-secondary-600">
                  <div className="rounded-xl bg-white border border-secondary-200/70 p-2.5">
                    <span className="block text-[10px] text-secondary-400 uppercase font-bold">Avg. Tuition</span>
                    <span className="text-secondary-900 font-bold">{avgCost}</span>
                  </div>
                  <div className="rounded-xl bg-white border border-secondary-200/70 p-2.5">
                    <span className="block text-[10px] text-secondary-400 uppercase font-bold">Post-Study Visa</span>
                    <span className="text-secondary-900 font-bold">{workRights}</span>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-secondary-500">
                  {highlight}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-secondary-200/60 flex items-center justify-between">
                <button
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 transition"
                  onClick={() => onViewDestination?.(name)}
                  type="button"
                >
                  <span>Explore Universities</span>
                  <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
