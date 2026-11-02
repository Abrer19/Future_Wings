import { useId, useState, useRef } from 'react'
import SectionHeading from './SectionHeading.jsx'
import { ChevronDownIcon } from './icons.jsx'
import { useScrollReveal } from '../../lib/useScrollAnimation.js'

const questions = [
  {
    question: 'How does the tier-based recommendation algorithm work?',
    answer:
      'We analyze your cumulative GPA, academic field, English proficiency scores (IELTS/TOEFL/Duolingo), and available financial budget against 1,200+ historical admission criteria. We then partition recommendations into 3 transparent tiers: Reach (ambitious Ivy/TU9 programs), Target (solid matches aligned with your baseline), and Safety (high-acceptance options with verified low tuition or grants).',
  },
  {
    question: 'Is FutureWings completely free for international students?',
    answer:
      'Yes! Every student gets free access to create an account, explore all 20+ country destinations, run unlimited academic eligibility checks, and track applications. For students seeking priority document verification, unlimited voice AI visa mock interviews, and personalized mentor evaluations, we offer affordable student-friendly monthly and annual passes.',
  },
  {
    question: 'How does the Document Vault ensure compliance before submission?',
    answer:
      'When you upload your Statement of Purpose (SOP), transcripts, and financial sponsor letters, our automated compliance engine scans for common rejection triggers: word count violations, mismatched names, missing embassy seals, and insufficient fund proof. You receive a structured checklist and actionable audit report before you submit.',
  },
  {
    question: 'How does the AI Visa Readiness check calculate grant probability?',
    answer:
      'Our visa engine evaluates your home-country ties, financial funding adequacy, program alignment, and historical consular refusal data for your jurisdiction. It generates a percentage readiness score and highlights specific risk vectors (such as vague career intent or borderline bank balances) with clear guidance on how to remediate them.',
  },
  {
    question: 'Can I track applications across different countries simultaneously?',
    answer:
      'Absolutely. You can shortlist programs in the United States, United Kingdom, Canada, Germany, Australia, and Japan in a single unified dashboard. FutureWings automatically manages individual submission deadlines, standardized test reporting windows, and intake cycles (Fall, Spring, Summer).',
  },
  {
    question: 'Which countries and study levels are currently supported?',
    answer:
      'We currently support undergraduate, master’s, PhD, and post-graduate diploma programs across 6 premier destinations: United States, United Kingdom, Canada, Germany, Australia, and Japan, covering over 1,200 verified institutions. Additional European and Asian destinations are added continuously.',
  },
]

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0) // Default first item open for instant preview
  const baseId = useId()
  const containerRef = useRef(null)

  useScrollReveal(containerRef, {
    direction: 'up',
    distance: 24,
    duration: 0.8,
  })

  return (
    <section
      aria-labelledby="faq-title"
      className="relative bg-white py-20 sm:py-28 overflow-hidden"
      id="faq"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Frequently Asked Questions"
          badgeClassName="bg-primary-50 text-primary-700 border border-primary-200/80"
          description="Everything you need to know about the platform, algorithms, admissions, and visas."
          id="faq-title"
          title="Common questions from international applicants"
        />

        <div className="mt-14 sm:mt-18" ref={containerRef}>
          <ul className="space-y-4">
            {questions.map(({ question, answer }, index) => {
              const expanded = openIndex === index
              const panelId = `${baseId}-panel-${index}`
              const buttonId = `${baseId}-button-${index}`

              return (
                <li
                  key={question}
                  className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                    expanded
                      ? 'border-primary-300 bg-surface shadow-sm ring-1 ring-primary-200/50'
                      : 'border-secondary-200/80 bg-white hover:border-secondary-300'
                  }`}
                >
                  <h3>
                    <button
                      aria-controls={panelId}
                      aria-expanded={expanded}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-sm sm:text-base font-bold text-secondary-950 transition hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                      id={buttonId}
                      onClick={() => setOpenIndex(expanded ? null : index)}
                      type="button"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-[11px] font-bold text-secondary-600">
                          {index + 1}
                        </span>
                        <span>{question}</span>
                      </span>
                      <ChevronDownIcon
                        className={`h-5 w-5 shrink-0 text-secondary-400 transition-transform duration-300 ${
                          expanded ? 'rotate-180 text-primary-600' : ''
                        }`}
                      />
                    </button>
                  </h3>

                  {/* Smooth height accordion with CSS grid transition */}
                  <div
                    aria-labelledby={buttonId}
                    id={panelId}
                    role="region"
                    style={{
                      display: 'grid',
                      gridTemplateRows: expanded ? '1fr' : '0fr',
                      transition: 'grid-template-rows 250ms ease-in-out',
                    }}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-secondary-200/60 px-6 py-5 text-xs sm:text-sm leading-relaxed text-secondary-600 bg-white/50">
                        <p>{answer}</p>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Prompt banner below FAQ */}
          <div className="mt-10 rounded-2xl border border-secondary-200/70 bg-secondary-50/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-secondary-900">
                Have a unique profile or visa question?
              </p>
              <p className="text-xs text-secondary-500 mt-0.5">
                Our support counselors and AI advisor are available 24/7.
              </p>
            </div>
            <a
              href="mailto:futurewingshelp@gmail.com"
              className="inline-flex items-center justify-center rounded-xl bg-white border border-secondary-200 px-4 py-2.5 text-xs font-bold text-secondary-900 shadow-xs hover:border-primary-400 hover:text-primary-600 transition"
            >
              Contact Advisory Team
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
