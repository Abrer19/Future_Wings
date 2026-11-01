import { AlertTriangleIcon, CheckIcon, SparkleIcon } from './icons.jsx'
import { useScrollReveal } from '../../lib/useScrollAnimation.js'

const comparisons = [
  {
    problem: 'Scattered forums, obsolete blog posts, and biased agency brochures with opaque fees.',
    solution: 'A unified catalog of 1,200+ accredited institutions with transparent tuition, requirements, and post-study work rights.',
  },
  {
    problem: 'Missed university admission windows and overlooked scholarship filing dates.',
    solution: 'A single automated milestone roadmap that synchronizes exam, document, and scholarship deadlines in one dashboard.',
  },
  {
    problem: 'Uncertainty over embassy financial proofs and sudden, unexplained visa rejections.',
    solution: 'Predictive 4-factor Visa Readiness score that evaluates funds, family ties, and test scores before you file.',
  },
  {
    problem: 'Subjective university shortlisting based on hearsay rather than real academic fit.',
    solution: 'Objective AI recommendations that calculate quantitative match scores against your CGPA, budget, and research goals.',
  },
]

export default function ProblemSolution() {
  const containerRef = useScrollReveal({ direction: 'up', distance: 28 })

  return (
    <section
      aria-labelledby="comparison-title"
      className="bg-surface py-20 sm:py-28 relative"
      id="comparison"
      ref={containerRef}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-700">
            The Study-Abroad Challenge
          </span>
          <h2
            className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-secondary-950"
            id="comparison-title"
          >
            The old way was chaotic.{' '}
            <span className="text-primary-600">FutureWings brings total clarity.</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-secondary-600 leading-relaxed">
            International admissions shouldn’t feel like navigating a maze blindfolded. See how our
            intelligent student workspace transforms every stage of your journey.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {/* Old Way Column */}
          <div className="rounded-3xl border border-rose-200/80 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2.5 border-b border-rose-100 pb-4 mb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <AlertTriangleIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-secondary-950">The Fragmented Way</h3>
                <p className="text-xs text-rose-600 font-semibold">Spreadsheets, guesswork & anxiety</p>
              </div>
            </div>

            <ul className="space-y-5">
              {comparisons.map((item, index) => (
                <li className="flex items-start gap-3" key={index}>
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 font-bold text-xs">
                    ✕
                  </span>
                  <p className="text-xs sm:text-sm text-secondary-600 leading-relaxed">
                    {item.problem}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* FutureWings Way Column */}
          <div className="rounded-3xl border-2 border-primary-500/30 bg-white p-6 sm:p-8 shadow-xl shadow-primary-500/5 relative overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary-500/10 blur-2xl" />

            <div className="flex items-center gap-2.5 border-b border-secondary-100 pb-4 mb-6 relative z-10">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-amber-500 text-white shadow-sm">
                <SparkleIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-secondary-950">The FutureWings Way</h3>
                <p className="text-xs text-primary-600 font-semibold">Structured, predictive & transparent</p>
              </div>
            </div>

            <ul className="space-y-5 relative z-10">
              {comparisons.map((item, index) => (
                <li className="flex items-start gap-3" key={index}>
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-xs">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-xs sm:text-sm text-secondary-900 font-medium leading-relaxed">
                    {item.solution}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
