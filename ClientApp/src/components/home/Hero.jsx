import { useId, useState } from 'react'
import { ArrowRightIcon, SparkleIcon } from './icons.jsx'

const degreeLevels = ["Bachelor's", "Master's", 'PhD']
const budgets = ['Under $15,000', '$15,000 – $30,000', '$30,000 – $50,000', 'Over $50,000']

const emptyForm = { degree: '', major: '', cgpa: '', budget: '' }

function estimateTier({ cgpa, budget }) {
  const score = Number.parseFloat(cgpa)
  if (!Number.isFinite(score) || score < 0 || score > 4) return null

  const generousBudget = budget === '$30,000 – $50,000' || budget === 'Over $50,000'
  if (score >= 3.5 && generousBudget) return { tier: 'Tier 1 Priority Match', blurb: 'Outstanding profile! High admission & scholarship probability for top 100 global universities in USA, UK, Canada & Australia.' }
  if (score >= 3.0) return { tier: 'Tier 2 Strong Fit', blurb: 'Great profile! Highly competitive for excellent public & research institutions in Europe, Canada, and Asia with tuition waivers.' }
  return { tier: 'Tier 3 Direct Pathways', blurb: 'Good baseline options with pathway programs, regional scholarships, and dedicated language prep.' }
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
      setError('Please enter a valid CGPA between 0.00 and 4.00')
      return
    }
    setError('')
    setResult(estimate)
  }

  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-gradient-to-b from-primary-50/70 via-white to-surface pt-6 pb-20 sm:pb-28"
      id="home"
    >
      {/* Radiant Background Ambient Orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-20 h-96 w-96 rounded-full bg-primary-500/15 blur-3xl animate-pulse-glow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-96 h-80 w-[600px] rounded-full bg-primary-200/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16">
        {/* Floating Trust Badge */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-4 py-1.5 text-xs font-bold text-primary-700 shadow-sm backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-ping" />
            <span>AI-Driven Admissions & Visa Advisory</span>
          </div>

          <h1
            className="mt-6 text-4xl font-black leading-tight tracking-tight text-secondary-950 sm:text-5xl lg:text-6xl"
            id="hero-title"
          >
            Empower Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-primary-600 to-amber-500">Study Abroad</span> Dreams
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-secondary-600 sm:text-lg">
            Personalized university discovery, real-time visa readiness scoring, scholarship matching, and AI mock interview simulations — all in one modern platform.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-primary-500 px-8 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-600 hover:shadow-primary-500/40 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:w-auto"
              onClick={onGetRecommendations}
              type="button"
            >
              <SparkleIcon className="h-4 w-4" />
              <span>Get Matched Now</span>
            </button>
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-secondary-200 bg-white px-8 py-3.5 text-sm font-bold text-secondary-800 shadow-sm transition hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-700 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:w-auto"
              onClick={onExploreCountries}
              type="button"
            >
              <span>Explore 20+ Destinations</span>
            </button>
          </div>

          {/* Floating Trust Metrics */}
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl mx-auto">
            <div className="rounded-2xl border border-secondary-100 bg-white/70 backdrop-blur-md p-3 text-center shadow-sm">
              <span className="block text-xl font-black text-secondary-950">1,200+</span>
              <span className="text-[11px] font-semibold text-secondary-500">Partner Universities</span>
            </div>
            <div className="rounded-2xl border border-secondary-100 bg-white/70 backdrop-blur-md p-3 text-center shadow-sm">
              <span className="block text-xl font-black text-primary-600">98.4%</span>
              <span className="text-[11px] font-semibold text-secondary-500">Visa Success Rate</span>
            </div>
            <div className="rounded-2xl border border-secondary-100 bg-white/70 backdrop-blur-md p-3 text-center shadow-sm">
              <span className="block text-xl font-black text-secondary-950">৳50M+</span>
              <span className="text-[11px] font-semibold text-secondary-500">Scholarships Won</span>
            </div>
            <div className="rounded-2xl border border-secondary-100 bg-white/70 backdrop-blur-md p-3 text-center shadow-sm">
              <span className="block text-xl font-black text-primary-600">100%</span>
              <span className="text-[11px] font-semibold text-secondary-500">Free On-Device AI</span>
            </div>
          </div>
        </div>

        {/* Quick Eligibility Checker Card */}
        <form
          aria-labelledby="eligibility-title"
          className="mx-auto mt-12 max-w-4xl rounded-3xl border border-white/80 bg-white/95 p-6 shadow-2xl shadow-secondary-500/10 backdrop-blur-xl sm:p-8 relative z-10"
          onSubmit={submit}
        >
          <div className="flex items-center justify-between border-b border-secondary-100 pb-4 mb-6">
            <div>
              <h2
                className="text-base font-extrabold text-secondary-950"
                id="eligibility-title"
              >
                Instant Admission & Scholarship Tier Check
              </h2>
              <p className="text-xs text-secondary-500 mt-0.5">Calculate your global admission competitiveness in 5 seconds</p>
            </div>
            <span className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-extrabold uppercase text-primary-700">
              Free Check
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field id={`${fieldId}-degree`} label="Degree Level">
              <select
                className="w-full rounded-xl border border-secondary-200 bg-white px-3.5 py-2.5 text-sm font-medium text-secondary-950 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                id={`${fieldId}-degree`}
                onChange={update('degree')}
                value={form.degree}
              >
                <option value="">Select Level</option>
                {degreeLevels.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </Field>

            <Field id={`${fieldId}-major`} label="Intended Major">
              <input
                className="w-full rounded-xl border border-secondary-200 bg-white px-3.5 py-2.5 text-sm font-medium text-secondary-950 outline-none transition placeholder:text-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                id={`${fieldId}-major`}
                onChange={update('major')}
                placeholder="e.g. Computer Science"
                type="text"
                value={form.major}
              />
            </Field>

            <Field id={`${fieldId}-cgpa`} label="CGPA (out of 4.0)">
              <input
                className="w-full rounded-xl border border-secondary-200 bg-white px-3.5 py-2.5 text-sm font-medium text-secondary-950 outline-none transition placeholder:text-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                id={`${fieldId}-cgpa`}
                inputMode="decimal"
                max="4"
                min="0"
                onChange={update('cgpa')}
                placeholder="e.g. 3.65"
                step="0.01"
                type="number"
                value={form.cgpa}
              />
            </Field>

            <Field id={`${fieldId}-budget`} label="Annual Budget (USD)">
              <select
                className="w-full rounded-xl border border-secondary-200 bg-white px-3.5 py-2.5 text-sm font-medium text-secondary-950 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                id={`${fieldId}-budget`}
                onChange={update('budget')}
                value={form.budget}
              >
                <option value="">Select Range</option>
                {budgets.map((budget) => (
                  <option key={budget}>{budget}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-secondary-100">
            <span className="text-xs text-secondary-500">
              Evaluates academic fit, financial adequacy, and visa viability.
            </span>
            <button
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary-500 hover:bg-primary-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-md shadow-primary-500/25 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              type="submit"
            >
              <span>Calculate My Tier</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div aria-live="polite" className="mt-4 min-h-[1.5rem]">
            {error && (
              <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-xs font-semibold text-danger-700" role="alert">
                {error}
              </div>
            )}
            {result && (
              <div className="rounded-2xl border border-success-200 bg-success-50/70 p-4 text-sm animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-success-600 text-white px-2.5 py-0.5 text-xs font-black uppercase">
                    {result.tier}
                  </span>
                  <span className="font-bold text-success-900">Result Evaluated</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-secondary-700">
                  {result.blurb}
                </p>
              </div>
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
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-secondary-700" htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  )
}
