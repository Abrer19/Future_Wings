import { ArrowRightIcon } from './icons.jsx'

export default function ClosingCta({ onSignUp }) {
  return (
    <section aria-labelledby="cta-title" className="bg-surface pb-20 sm:pb-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white bg-gradient-to-br from-primary-50 via-white to-[#eef2ff] px-6 py-14 text-center shadow-lg shadow-secondary-500/10 sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-500/10 blur-3xl"
          />
          <div className="relative">
            <h2
              className="text-2xl font-extrabold tracking-tight text-secondary-950 sm:text-3xl"
              id="cta-title"
            >
              Ready to Start Your Journey?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-secondary-500">
              Join thousands of students who have already found their dream university through
              FutureWings.
            </p>
            <button
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              onClick={onSignUp}
              type="button"
            >
              Create Free Account
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
