import SectionHeading from './SectionHeading.jsx'
import {
  CompassIcon,
  DocumentCheckIcon,
  ScholarshipIcon,
  ShieldIcon,
  StarIcon,
  TrackIcon,
} from './icons.jsx'

// Icon tints are full literal class strings, not interpolated — Tailwind's scanner
// only emits arbitrary values it can read verbatim in the source.
const features = [
  {
    title: 'Tier-Based Recommendations',
    description:
      'Get personalized country recommendations based on your CGPA, major, and financial readiness.',
    Icon: CompassIcon,
    tint: 'bg-accent/10 text-accent',
  },
  {
    title: 'Scholarships by Country',
    description: 'Discover scholarship opportunities tailored to your destination country and profile.',
    Icon: ScholarshipIcon,
    tint: 'bg-success/10 text-success',
  },
  {
    title: 'Application Tracking',
    description:
      'Track every application from submission to acceptance with real-time status updates.',
    Icon: TrackIcon,
    tint: 'bg-primary-500/10 text-primary-500',
  },
  {
    title: 'Document Verification',
    description:
      'Upload and get your documents verified — transcripts, recommendation letters, SOPs.',
    Icon: DocumentCheckIcon,
    tint: 'bg-secondary-500/10 text-secondary-500',
  },
  {
    title: 'Visa Outcome',
    description: 'Receive visa decision updates and guidance for next steps after interview.',
    Icon: ShieldIcon,
    tint: 'bg-warning/10 text-warning',
  },
  {
    title: 'Post-Visa Ratings',
    description: 'Rate your experience and help future applicants make informed decisions.',
    Icon: StarIcon,
    tint: 'bg-danger/10 text-danger',
  },
]

export default function Features() {
  return (
    <section aria-labelledby="features-title" className="bg-surface py-20 sm:py-24" id="features">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          badge="Features"
          badgeClassName="bg-primary-500/10 text-primary-500"
          description="One platform to manage your entire study abroad journey — from discovery to departure."
          id="features-title"
          title="Everything You Need"
        />

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, description, Icon, tint }) => (
            <li
              className="rounded-2xl border border-secondary-500/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-500/30 hover:shadow-md"
              key={title}
            >
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}>
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-base font-bold text-secondary-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-secondary-500">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
