import { useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { BTN_PRIMARY, CARD, CONTROL, FOCUS } from '../components/ui/styles.js'

const degreeLevels = ["Bachelor's", "Master's", 'PhD']

/** Server accepts null for "not set"; the form works in strings and converts on save. */
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
      setToast('Profile saved')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const filled = form ? STUDY_FIELDS.filter((field) => form[field] !== '' && form[field] !== null).length : 0

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Profile</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-secondary-950">Your study plan</h1>
        <p className="mt-2 text-secondary-500">
          These details drive your program matches and your roadmap.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className={`space-y-4 p-6 ${CARD}`} aria-label="Loading profile">
          {[1, 2, 3, 4, 5].map((row) => (
            <div className="animate-pulse" key={row}>
              <div className="h-3 w-24 rounded bg-secondary-100" />
              <div className="mt-2 h-10 rounded-lg bg-secondary-100" />
            </div>
          ))}
        </div>
      ) : form ? (
        <form className={`p-6 ${CARD}`} onSubmit={save}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-bold text-secondary-950">Study details</h2>
            <p aria-live="polite" className="text-sm text-secondary-500">
              {filled} of {STUDY_FIELDS.length} completed
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field id="firstName" label="First name">
              <input className={`w-full ${CONTROL}`} id="firstName" maxLength={100} onChange={set('firstName')} required type="text" value={form.firstName} />
            </Field>
            <Field id="lastName" label="Last name">
              <input className={`w-full ${CONTROL}`} id="lastName" maxLength={100} onChange={set('lastName')} required type="text" value={form.lastName} />
            </Field>

            <Field hint="Out of 4.0" id="cgpa" label="CGPA">
              <input className={`w-full ${CONTROL}`} id="cgpa" inputMode="decimal" max="4" min="0" onChange={set('cgpa')} placeholder="e.g. 3.5" step="0.01" type="number" value={form.cgpa} />
            </Field>
            <Field id="major" label="Major">
              <input className={`w-full ${CONTROL}`} id="major" maxLength={100} onChange={set('major')} placeholder="e.g. Computer Science" type="text" value={form.major} />
            </Field>

            <Field hint="Annual, in USD" id="budgetUsd" label="Budget">
              <input className={`w-full ${CONTROL}`} id="budgetUsd" inputMode="numeric" min="0" onChange={set('budgetUsd')} placeholder="e.g. 30000" step="500" type="number" value={form.budgetUsd} />
            </Field>
            <Field id="degreeLevel" label="Degree level">
              <select className={`w-full ${CONTROL}`} id="degreeLevel" onChange={set('degreeLevel')} value={form.degreeLevel}>
                <option value="">Not set</option>
                {degreeLevels.map((level) => <option key={level}>{level}</option>)}
              </select>
            </Field>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button className={BTN_PRIMARY} disabled={saving} type="submit">
              {saving ? 'Saving…' : 'Save profile'}
            </button>
            <p className="text-sm text-secondary-500">Leave a field blank to clear it.</p>
          </div>
        </form>
      ) : (
        <div className={`px-6 py-12 text-center ${CARD}`}>
          <p className="font-semibold text-secondary-950">Profile unavailable</p>
          <p className="mt-1 text-sm text-secondary-500">We couldn&rsquo;t load your profile. Try reloading the page.</p>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}

function Field({ id, label, hint, children }) {
  return (
    <div>
      <label className={`mb-1.5 block text-sm font-medium text-secondary-700 ${FOCUS}`} htmlFor={id}>
        {label}
        {hint && <span className="ml-1 font-normal text-secondary-400">({hint})</span>}
      </label>
      {children}
    </div>
  )
}
