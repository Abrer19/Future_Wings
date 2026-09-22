import SectionHeading from './SectionHeading.jsx'
import {
  CompassIcon,
  DocumentCheckIcon,
  ScholarshipIcon,
  ShieldIcon,
  StarIcon,
  TrackIcon,
} from './icons.jsx'

const features = [
  {
    title: 'Tier-Based AI Matching',
    tag: 'Algorithms',
    description:
      'Get personalized program and country recommendations tailored to your CGPA, major, and budget readiness.',
    Icon: CompassIcon,
    tint: 'bg-primary-50 text-primary-600 border border-primary-200',
  },
  {
    title: 'Global Scholarships Directory',
    tag: 'Funding',
    description: 'Discover full & partial tuition waivers tailored to your destination country and academic profile.',
    Icon: ScholarshipIcon,
    tint: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  },
  {
    title: 'Real-Time Application CRM',
    tag: 'Tracking',
    description:
      'Monitor every application from draft to submission, review, and offer letter in one organized pipeline.',
    Icon: TrackIcon,
    tint: 'bg-amber-50 text-amber-600 border border-amber-200',
  },
  {
    title: 'Document & SOP Vault',
    tag: 'Secure',
    description:
      'Store, organize, and prepare verified transcripts, letters of recommendation, and statements of purpose.',
    Icon: DocumentCheckIcon,
    tint: 'bg-blue-50 text-blue-600 border border-blue-200',
  },
  {
    title: 'Visa Readiness Evaluation',
    tag: 'Risk Analysis',
    description: 'Analyze financial coverage, ties to home country, and language scores before your embassy interview.',
    Icon: ShieldIcon,
    tint: 'bg-purple-50 text-purple-600 border border-purple-200',
  },
  {
    title: 'AI Mock Interview Coach',
    tag: 'On-Device NLP',
    description: 'Practice answering real visa and university interview questions with real-time video framing and NLP feedback.',
    Icon: StarIcon,
    tint: 'bg-rose-50 text-rose-600 border border-rose-200',
  },
]

export default function Features() {
  return (
    <section aria-labelledby="features-title" className="bg-surface py-20 sm:py-28 relative overflow-hidden" id="features">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <SectionHeading
          badge="Complete Study Ecosystem"
          badgeClassName="bg-primary-100 text-primary-800"
          description="Everything you need to discover, apply, fund, and succeed in your international university journey."
          id="features-title"
          title="Empowering Every Step of Your Journey"
        />

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, tag, description, Icon, tint }) => (
            <li
              className="group rounded-3xl border border-secondary-200/80 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-primary-300 hover:shadow-xl hover:shadow-primary-500/5 relative flex flex-col justify-between"
              key={title}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition group-hover:scale-105 ${tint}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="rounded-full bg-secondary-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-secondary-600">
                    {tag}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-bold text-secondary-950 group-hover:text-primary-600 transition">
                  {title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-secondary-500">
                  {description}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-secondary-100/80 flex items-center text-xs font-bold text-primary-600 group-hover:translate-x-1 transition">
                <span>Learn more &rarr;</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
