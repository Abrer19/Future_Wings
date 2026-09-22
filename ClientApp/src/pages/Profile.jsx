import { useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { BTN_PRIMARY, CARD, CONTROL, FOCUS } from '../components/ui/styles.js'

const degreeLevels = ["Bachelor's", "Master's", 'PhD', 'Diploma', 'Certificate']

const toForm = (profile) => ({
  firstName: profile.firstName ?? '',
  lastName: profile.lastName ?? '',
  cgpa: profile.cgpa ?? '',
  major: profile.major ?? '',
  budgetUsd: profile.budgetUsd ?? '',
  degreeLevel: profile.degreeLevel ?? '',
})

const toPayload = (form) => ({
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
  cgpa: form.cgpa === '' ? null : Number(form.cgpa),
  major: form.major.trim() === '' ? null : form.major.trim(),
  budgetUsd: form.budgetUsd === '' ? null : Number(form.budgetUsd),
  degreeLevel: form.degreeLevel === '' ? null : form.degreeLevel,
})

const STUDY_FIELDS = ['cgpa', 'major', 'budgetUsd', 'degreeLevel']

export default function Profile({ session }) {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    apiRequest('/profile', { token: session.token })
      .then((profile) => { if (active) setForm(toForm(profile)) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [session.token])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const set = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }))

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const saved = await apiRequest('/profile', {
        token: session.token,
        method: 'PUT',
        body: JSON.stringify(toPayload(form)),
      })
      setForm(toForm(saved))
      setToast('Profile updated successfully')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const filled = form ? STUDY_FIELDS.filter((field) => form[field] !== '' && form[field] !== null).length : 0
  const completionPercent = Math.round((filled / STUDY_FIELDS.length) * 100)

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Header Banner */}
      <header className="relative overflow-hidden rounded-3xl border border-secondary-200 bg-gradient-to-r from-secondary-950 via-secondary-900 to-secondary-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-primary-500/20 border border-primary-400/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-300">
                <span className="h-2 w-2 rounded-full bg-primary-400" />
                Academic Profile
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-white">
              Your Study & Visa Profile
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-secondary-300 max-w-xl">
              These credentials drive your admission matches, scholarship suitability, and personalized roadmap.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur-md px-5 py-3 border border-white/15 text-center min-w-[130px]">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-secondary-300">Profile Match</span>
            <span className="font-mono text-2xl font-black text-primary-400">{completionPercent}%</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-xs text-danger-700 shadow-sm" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-secondary-200 bg-white p-8 space-y-4 shadow-sm" aria-label="Loading profile">
          {[1, 2, 3, 4, 5].map((row) => (
            <div className="animate-pulse" key={row}>
              <div className="h-3 w-24 rounded bg-secondary-100" />
              <div className="mt-2 h-10 rounded-xl bg-secondary-100" />
            </div>
          ))}
        </div>
      ) : form ? (
        <form className="rounded-3xl border border-secondary-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6" onSubmit={save}>
          <div className="flex items-center justify-between border-b border-secondary-100 pb-4">
            <h2 className="text-base font-extrabold text-secondary-950">Personal & Academic Details</h2>
            <span className="text-xs font-bold text-primary-600 bg-primary-50 border border-primary-200 px-2.5 py-0.5 rounded-lg">
              {filled} of {STUDY_FIELDS.length} Core Fields Completed
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="firstName" label="First Name">
              <input className={`w-full ${CONTROL}`} id="firstName" maxLength={100} onChange={set('firstName')} required type="text" value={form.firstName} />
            </Field>
            <Field id="lastName" label="Last Name">
              <input className={`w-full ${CONTROL}`} id="lastName" maxLength={100} onChange={set('lastName')} required type="text" value={form.lastName} />
            </Field>

            <Field hint="Out of 4.0 scale" id="cgpa" label="Undergraduate / High School CGPA">
              <input className={`w-full ${CONTROL}`} id="cgpa" inputMode="decimal" max="4" min="0" onChange={set('cgpa')} placeholder="e.g. 3.75" step="0.01" type="number" value={form.cgpa} />
            </Field>
            <Field id="major" label="Target Academic Major">
              <input className={`w-full ${CONTROL}`} id="major" maxLength={100} onChange={set('major')} placeholder="e.g. Computer Science & AI" type="text" value={form.major} />
            </Field>

            <Field hint="Estimated annual liquid funds" id="budgetUsd" label="Annual Tuition & Living Budget (USD)">
              <input className={`w-full ${CONTROL}`} id="budgetUsd" inputMode="numeric" min="0" onChange={set('budgetUsd')} placeholder="e.g. 25000" step="500" type="number" value={form.budgetUsd} />
            </Field>
            <Field id="degreeLevel" label="Target Degree Level">
              <select className={`w-full ${CONTROL}`} id="degreeLevel" onChange={set('degreeLevel')} value={form.degreeLevel}>
                <option value="">Select Degree Level</option>
                {degreeLevels.map((level) => <option key={level}>{level}</option>)}
              </select>
            </Field>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-secondary-100 pt-5">
            <p className="text-xs text-secondary-500 font-medium">
              Updating your profile automatically recalculates your scholarship & admission matches.
            </p>
            <button className="rounded-2xl bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 text-xs font-extrabold shadow-md shadow-primary-500/25 transition disabled:opacity-50" disabled={saving} type="submit">
              {saving ? 'Saving Changes…' : 'Save Profile Details'}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-3xl border border-secondary-200 bg-white p-12 text-center shadow-sm">
          <p className="font-bold text-secondary-950 text-base">Profile unavailable</p>
          <p className="mt-1 text-xs text-secondary-500">We could not load your profile. Please reload or verify connection.</p>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}

function Field({ id, label, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-secondary-700" htmlFor={id}>
        {label}
        {hint && <span className="ml-1 text-[11px] font-normal text-secondary-400">({hint})</span>}
      </label>
      {children}
    </div>
  )
}
