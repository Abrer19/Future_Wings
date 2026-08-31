import SectionHeading from './SectionHeading.jsx'
import {
  BadgeCheckIcon,
  CompassIcon,
  ProfileIcon,
  SendIcon,
  UploadIcon,
  UserPlusIcon,
} from './icons.jsx'

const steps = [
  { title: 'Create Account', description: 'Sign up in seconds and get started.', Icon: UserPlusIcon },
  { title: 'Complete Profile', description: 'Add CGPA, major, and fund score.', Icon: ProfileIcon },
  { title: 'Upload Documents', description: 'Submit transcripts and SOPs for verification.', Icon: UploadIcon },
  {
    title: 'Get Recommendations',
    description: 'Receive tier-based country and program matches.',
    Icon: CompassIcon,
  },
  { title: 'Apply & Track', description: 'Apply to programs and monitor application status.', Icon: SendIcon },
  { title: 'Visa & Rate', description: 'Get visa outcome and rate your experience.', Icon: BadgeCheckIcon },
]

export default function HowItWorks() {
  return (
    <section aria-labelledby="process-title" className="bg-surface py-20 sm:py-24" id="process">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          badge="Process"
          badgeClassName="bg-accent/10 text-accent"
          description="Six simple steps from signup to studying abroad."
          id="process-title"
          title="How It Works"
        />

        <div className="relative mt-14">
          {/* Connector rail, desktop only. Decorative, so it is hidden from assistive tech
              and the ordered list below carries the actual sequence. */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent lg:block"
          />

          <ol className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
            {steps.map(({ title, description, Icon }, index) => (
              <li className="flex flex-col items-center text-center" key={title}>
                <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-secondary-500/10 bg-white text-primary-500 shadow-sm">
                  <Icon className="h-6 w-6" />
                  <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
                    <span className="sr-only">Step </span>
                    {index + 1}
                  </span>
                </span>
                <h3 className="mt-4 text-sm font-bold text-secondary-950">{title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-secondary-500">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
