import { useRef } from 'react'
import SectionHeading from './SectionHeading.jsx'
import {
  ProfileIcon,
  CompassIcon,
  DocumentCheckIcon,
  BadgeCheckIcon,
  CheckIcon,
} from './icons.jsx'
import { useScrollReveal } from '../../lib/useScrollAnimation.js'

const steps = [
  {
    step: '01',
    title: 'Build Your Profile',
    category: 'Diagnostic',
    description:
      'Input your CGPA, target major, standardized test scores, and budget in under 3 minutes. Our algorithm indexes your baseline readiness.',
    Icon: ProfileIcon,
    highlights: ['Academic & GPA calibration', 'Living cost & budget calculator', 'Target intake timeline'],
  },
  {
    step: '02',
    title: 'Discover Tiered Matches',
    category: 'Intelligence',
    description:
      'Explore personalized program matches categorized into Reach, Target, and Safety tiers with verified scholarship eligibility.',
    Icon: CompassIcon,
    highlights: ['3 admission risk tiers', 'Institutional scholarship radar', 'Tuition & post-study ROI data'],
  },
  {
    step: '03',
    title: 'Organize & Verify Vault',
    category: 'Preparation',
    description:
      'Upload SOPs, transcripts, and financial guarantees. Automated document checks catch formatting and compliance gaps before submission.',
    Icon: DocumentCheckIcon,
    highlights: ['Pre-submission audit checks', 'Centralized deadline countdowns', 'Unified multi-app tracker'],
  },
  {
    step: '04',
    title: 'Apply & Visa Rehearsal',
    category: 'Execution',
    description:
      'Practice embassy interviews with our voice-enabled AI officer and calculate your official visa grant probability score before booking.',
    Icon: BadgeCheckIcon,
    highlights: ['Voice AI consular simulation', 'Visa approval readiness score', 'Post-study graduate route plan'],
  },
]

export default function HowItWorks() {
  const containerRef = useRef(null)
  useScrollReveal(containerRef, {
    direction: 'up',
    distance: 28,
    duration: 0.8,
    stagger: 0.14,
  })

  return (
    <section
      aria-labelledby="process-title"
      className="relative bg-surface py-20 sm:py-28 overflow-hidden"
      id="process"
    >
      {/* Subtle ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-r from-primary-500/5 via-accent/5 to-transparent blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="How It Works"
          badgeClassName="bg-primary-50 text-primary-700 border border-primary-200/80"
          description="A structured, predictable 4-step path from your initial search to walking onto campus."
          id="process-title"
          title="From initial ambition to your student visa"
        />

        {/* Timeline container */}
        <div className="relative mt-16 sm:mt-20" ref={containerRef}>
          {/* Desktop connecting rail */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-[4.25rem] left-[6%] right-[6%] h-[2px] bg-gradient-to-r from-secondary-200 via-primary-300 to-accent/40 z-0"
          />

          <ol className="relative z-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ step, title, category, description, Icon, highlights }) => (
              <li
                key={step}
                className="group relative flex flex-col rounded-3xl border border-secondary-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-500/5"
              >
                {/* Step header: Number badge + Icon */}
                <div className="flex items-center justify-between">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary-50 border border-secondary-200 text-secondary-900 font-extrabold text-base group-hover:bg-primary-50 group-hover:border-primary-200 group-hover:text-primary-600 transition-colors">
                    <span>{step}</span>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-secondary-500 group-hover:text-primary-600 group-hover:bg-primary-50/50 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary-600">
                    {category}
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-secondary-950">
                    {title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-secondary-600">
                    {description}
                  </p>
                </div>

                {/* Highlights checklist */}
                <div className="mt-6 pt-5 border-t border-secondary-100 flex-1 flex flex-col justify-end">
                  <ul className="space-y-2 text-[11px] font-medium text-secondary-600">
                    {highlights.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckIcon className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
