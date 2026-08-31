import { useId, useState } from 'react'
import SectionHeading from './SectionHeading.jsx'
import { ChevronDownIcon } from './icons.jsx'

const questions = [
  {
    question: 'How does the tier-based recommendation work?',
    answer:
      'We score your CGPA, major, and stated budget against each destination’s admission and cost profile, then group the results into tiers so you can see ambitious, target, and safer options side by side.',
  },
  {
    question: 'Is FutureWings free to use?',
    answer:
      'Creating an account, browsing destinations, and running eligibility checks are free. Premium guidance and priority document review are offered as a paid subscription.',
  },
  {
    question: 'How are documents verified?',
    answer:
      'Upload transcripts, recommendation letters, and SOPs, and our reviewers check them for completeness, formatting, and the specific requirements of each destination before you submit.',
  },
  {
    question: 'Can I apply to multiple universities?',
    answer:
      'Yes. You can shortlist as many programs as you like and track every application from a single dashboard, with per-application status and deadlines.',
  },
  {
    question: 'What happens after I receive a visa outcome?',
    answer:
      'Record the outcome on your application and we will guide you through the next steps — whether that is pre-departure preparation or planning a reapplication.',
  },
  {
    question: 'What countries are currently supported?',
    answer:
      'We currently cover the United States, United Kingdom, Canada, Germany, Australia, and Japan, with more destinations added each term.',
  },
]

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null)
  const baseId = useId()

  return (
    <section aria-labelledby="faq-title" className="bg-surface py-20 sm:py-24" id="faq">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          badge="FAQ"
          badgeClassName="bg-warning/15 text-warning-700"
          description="Everything students ask us before getting started."
          id="faq-title"
          title="Frequently Asked Questions"
        />

        <ul className="mx-auto mt-12 max-w-3xl space-y-3">
          {questions.map(({ question, answer }, index) => {
            const expanded = openIndex === index
            const panelId = `${baseId}-panel-${index}`
            const buttonId = `${baseId}-button-${index}`

            return (
              <li
                className="overflow-hidden rounded-xl border border-secondary-500/10 bg-white shadow-sm"
                key={question}
              >
                <h3>
                  <button
                    aria-controls={panelId}
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-secondary-950 transition hover:bg-secondary-500/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500"
                    id={buttonId}
                    onClick={() => setOpenIndex(expanded ? null : index)}
                    type="button"
                  >
                    {question}
                    <ChevronDownIcon
                      className={`h-5 w-5 shrink-0 text-secondary-500 transition-transform duration-200 ${
                        expanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </h3>
                <div
                  aria-labelledby={buttonId}
                  hidden={!expanded}
                  id={panelId}
                  role="region"
                >
                  <p className="border-t border-secondary-500/10 px-5 py-4 text-sm leading-6 text-secondary-500">
                    {answer}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
