import { useState, useRef } from 'react'
import SectionHeading from './SectionHeading.jsx'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  StarFilledIcon,
  BadgeCheckIcon,
  GraduationCapIcon,
} from './icons.jsx'
import { useScrollReveal } from '../../lib/useScrollAnimation.js'

const stories = [
  {
    quote:
      'FutureWings calibrated my tier matching perfectly. When other consultancies told me my GPA was too low for Canada, the platform identified two high-match programs at Toronto and UBC. The AI SOP review caught compliance issues that would have cost me my admission.',
    name: 'Amara Nwosu',
    route: 'Lagos, Nigeria → Toronto, Canada',
    target: 'University of Toronto',
    program: 'MSc Computer Science',
    award: '$22,000 Fellowship',
    initials: 'AN',
    avatarBg: 'bg-primary-500 text-white',
    rating: 5,
  },
  {
    quote:
      'The country-specific scholarship radar found a DAAD stipend in Munich I never would have discovered on standard university portals. Plus, practicing the mock visa interview questions with the AI gave me complete confidence at the consulate window.',
    name: 'Daniel Osei',
    route: 'Accra, Ghana → Munich, Germany',
    target: 'Technical University of Munich',
    program: 'M.Sc. Robotics & Systems',
    award: 'DAAD Full Scholarship',
    initials: 'DO',
    avatarBg: 'bg-accent text-white',
    rating: 5,
  },
  {
    quote:
      'Applying to 4 Australian universities used to feel like chaos with endless spreadsheets. The FutureWings application pipeline tracked every deadline and certified all my financial solvency documents. Got my COE and visa within 3 weeks of lodgment.',
    name: 'Priya Raman',
    route: 'Bangalore, India → Melbourne, Australia',
    target: 'University of Melbourne',
    program: 'Master of Data Science',
    award: '50% Merit Grant',
    initials: 'PR',
    avatarBg: 'bg-secondary-800 text-white',
    rating: 5,
  },
  {
    quote:
      'The visa readiness check pinpointed an exact discrepancy between my sponsor affidavit and my bank statements. Fixing that before lodging prevented what surely would have been a 214(b) rejection. Now studying in Boston with STEM OPT eligibility!',
    name: 'Sofia Alvarez',
    route: 'Bogotá, Colombia → Boston, USA',
    target: 'Northeastern University',
    program: 'MS Bioinformatics',
    award: 'Graduate Dean Scholarship',
    initials: 'SA',
    avatarBg: 'bg-emerald-600 text-white',
    rating: 5,
  },
]

export default function Testimonials() {
  const [index, setIndex] = useState(0)
  const containerRef = useRef(null)

  useScrollReveal(containerRef, {
    direction: 'up',
    distance: 24,
    duration: 0.8,
  })

  const story = stories[index]
  const go = (next) => setIndex((next + stories.length) % stories.length)

  const onKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(index - 1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(index + 1)
    }
  }

  return (
    <section
      aria-labelledby="testimonials-title"
      className="relative bg-surface py-20 sm:py-28 overflow-hidden"
      id="testimonials"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Social Proof"
          badgeClassName="bg-primary-50 text-primary-700 border border-primary-200/80"
          description="Hear from international students who unlocked dream admissions, scholarships, and visa grants."
          id="testimonials-title"
          title="Proven outcomes across the globe"
        />

        <div
          aria-roledescription="carousel"
          className="mx-auto mt-14 max-w-4xl"
          onKeyDown={onKeyDown}
          ref={containerRef}
          role="group"
        >
          {/* Main Card with Navigation Controls */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-secondary-200/80 bg-white p-8 sm:p-12 shadow-sm transition-all">
              {/* Top Row: Stars + Verified Badge + Carousel Nav */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-secondary-100 pb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-amber-400">
                    <span className="sr-only">{story.rating} out of 5 stars</span>
                    {Array.from({ length: story.rating }, (_, i) => (
                      <StarFilledIcon key={i} className="h-4 w-4" />
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    <BadgeCheckIcon className="h-3.5 w-3.5" />
                    <span>Verified Admission</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    aria-label="Previous story"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-secondary-200 bg-white text-secondary-600 transition-colors hover:border-primary-500 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    onClick={() => go(index - 1)}
                    type="button"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-semibold text-secondary-400 px-1">
                    {index + 1} / {stories.length}
                  </span>
                  <button
                    aria-label="Next story"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-secondary-200 bg-white text-secondary-600 transition-colors hover:border-primary-500 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    onClick={() => go(index + 1)}
                    type="button"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Quote Body */}
              <blockquote aria-live="polite" className="mt-8">
                <p className="text-base sm:text-lg leading-relaxed text-secondary-800 font-medium">
                  &ldquo;{story.quote}&rdquo;
                </p>

                {/* Student Profile footer */}
                <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-secondary-100">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-sm shadow-xs ${story.avatarBg}`}
                    >
                      {story.initials}
                    </div>
                    <div>
                      <p className="font-bold text-secondary-950 text-sm sm:text-base">
                        {story.name}
                      </p>
                      <p className="text-xs text-secondary-500 font-medium">{story.route}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-secondary-900">
                      <GraduationCapIcon className="h-4 w-4 text-primary-500" />
                      <span>
                        {story.target} • {story.program}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-primary-600">
                      Awarded: {story.award}
                    </span>
                  </div>
                </footer>
              </blockquote>
            </div>
          </div>

          {/* Dot navigation */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {stories.map((item, dot) => (
              <button
                aria-current={dot === index ? 'true' : undefined}
                aria-label={`Show story from ${item.name}`}
                className={`transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  dot === index
                    ? 'h-2 w-8 rounded-full bg-primary-500'
                    : 'h-2 w-2 rounded-full bg-secondary-300 hover:bg-secondary-400'
                }`}
                key={item.name}
                onClick={() => setIndex(dot)}
                type="button"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
