import { useId, useState } from 'react'
import { ArrowRightIcon, SparkleIcon } from './icons.jsx'

const degreeLevels = ["Bachelor's", "Master's", 'PhD']
const budgets = ['Under $15,000', '$15,000 – $30,000', '$30,000 – $50,000', 'Over $50,000']

const emptyForm = { degree: '', major: '', cgpa: '', budget: '' }

/**
 * Scores the quick-check entirely on the client.
 *
 * There is deliberately no API call here: the backend's RecommendationService is a
 * placeholder that returns an empty list, so wiring this to /api/recommendation
 * would render an empty result. This is an indicative estimate — swap it for the
 * real endpoint once that service is implemented.
 */
function estimateTier({ cgpa, budget }) {
  const score = Number.parseFloat(cgpa)
  if (!Number.isFinite(score) || score < 0 || score > 4) return null

  const generousBudget = budget === '$30,000 – $50,000' || budget === 'Over $50,000'
  if (score >= 3.5 && generousBudget) return { tier: 'Tier 1', blurb: 'Strong match for top-ranked destinations.' }
  if (score >= 3.0) return { tier: 'Tier 2', blurb: 'Great fit for affordable, well-ranked programs.' }
  return { tier: 'Tier 3', blurb: 'Solid options available — scholarships can lift this.' }
}

export default function Hero({ onGetRecommendations, onExploreCountries }) {
  const [form, setForm] = useState(emptyForm)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fieldId = useId()

  const update = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }))

  const submit = (event) => {
    event.preventDefault()
    const estimate = estimateTier(form)
    if (!estimate) {
      setResult(null)
      setError('Enter a CGPA between 0 and 4 to see your tier.')
      return
    }
    setError('')
    setResult(estimate)
  }

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-gradient-to-b from-primary-50 via-[#f7f4ff] to-surface"
      id="home"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-secondary-500/15 bg-white/70 px-4 py-1.5 text-xs font-semibold text-secondary-500">
            AI-Powered Study Abroad Matching
          </span>

          <h1
            className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-secondary-950 sm:text-5xl lg:text-6xl"
            id="hero-title"
          >
            Plan Your <span className="text-primary-500">Study Abroad</span> Journey
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-secondary-500 sm:text-lg">
            Find the best destination countries, scholarships, and track your application — all in one
            place.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:w-auto"
              onClick={onGetRecommendations}
              type="button"
            >
              <SparkleIcon className="h-4 w-4" />
              Get Recommendations
            </button>
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-secondary-500/20 bg-white px-6 py-3 text-sm font-semibold text-secondary-950 shadow-sm transition hover:border-secondary-500/40 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:w-auto"
              onClick={onExploreCountries}
              type="button"
            >
              Explore Countries
            </button>
          </div>
        </div>

        <form
          aria-labelledby="eligibility-title"
          className="mx-auto mt-12 max-w-3xl rounded-2xl border border-white bg-white/90 p-6 shadow-xl shadow-secondary-500/10 backdrop-blur sm:p-8"
          onSubmit={submit}
        >
          <h2
            className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-secondary-500"
            id="eligibility-title"
          >
            Quick Eligibility Check
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field id={`${fieldId}-degree`} label="Degree Level">
              <select
                className="w-full rounded-lg border border-secondary-500/20 bg-white px-3 py-2.5 text-sm text-secondary-950 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                id={`${fieldId}-degree`}
                onChange={update('degree')}
                value={form.degree}
              >
                <option value="">Select</option>
                {degreeLevels.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </Field>

            <Field id={`${fieldId}-major`} label="Major">
              <input
                className="w-full rounded-lg border border-secondary-500/20 bg-white px-3 py-2.5 text-sm text-secondary-950 outline-none transition placeholder:text-secondary-500/50 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                id={`${fieldId}-major`}
                onChange={update('major')}
                placeholder="e.g. Computer Science"
                type="text"
                value={form.major}
              />
            </Field>

            <Field id={`${fieldId}-cgpa`} label="CGPA">
              <input
                className="w-full rounded-lg border border-secondary-500/20 bg-white px-3 py-2.5 text-sm text-secondary-950 outline-none transition placeholder:text-secondary-500/50 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                id={`${fieldId}-cgpa`}
                inputMode="decimal"
                max="4"
                min="0"
                onChange={update('cgpa')}
                placeholder="e.g. 3.5"
                step="0.01"
                type="number"
                value={form.cgpa}
              />
            </Field>

            <Field id={`${fieldId}-budget`} label="Budget">
              <select
                className="w-full rounded-lg border border-secondary-500/20 bg-white px-3 py-2.5 text-sm text-secondary-950 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                id={`${fieldId}-budget`}
                onChange={update('budget')}
                value={form.budget}
              >
                <option value="">Select</option>
                {budgets.map((budget) => (
                  <option key={budget}>{budget}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-500/25 transition hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              type="submit"
            >
              Get My Tier
              <ArrowRightIcon />
            </button>
          </div>

          <div aria-live="polite" className="mt-4 min-h-[1.5rem] text-center">
            {error && (
              <p className="text-sm font-medium text-danger" role="alert">
                {error}
              </p>
            )}
            {result && (
              <p className="text-sm text-secondary-500">
                <span className="font-bold text-success">{result.tier}</span> — {result.blurb}
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}

function Field({ id, label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-secondary-500" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}
