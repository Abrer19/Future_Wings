import { useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { BTN_PRIMARY, CARD, CONTROL, FOCUS } from '../components/ui/styles.js'

const steps = ['Study plan', 'Funding', 'Language', 'Visa history']
const initial = {
  applicationId: '', destinationCountry: '', degreeLevel: "Master's", intendedMajor: '',
  annualTuitionUsd: '', availableFundsUsd: '', hasFundingProof: false,
  financialAdequacyScore: 50, hasLanguageScore: false, ieltsOverallScore: '',
  tiesToHomeCountryScore: 50, hasPriorVisaRefusal: false,
}
const meter = {
  Low: { label: 'Low', color: 'bg-success-500', text: 'text-success-700' },
  Medium: { label: 'Moderate', color: 'bg-warning-500', text: 'text-warning-700' },
  High: { label: 'High', color: 'bg-danger-500', text: 'text-danger-700' },
}

export default function VisaCheck({ session }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initial)
  const [applications, setApplications] = useState([])
  const [programs, setPrograms] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      apiRequest('/applications', { token: session.token }),
      apiRequest('/discovery', { token: session.token }),
    ]).then(([tracked, discovery]) => {
      if (active) { setApplications(tracked); setPrograms(discovery.programs ?? []) }
    }).catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [session.token])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setResult(null)
    setError('')
  }

  const selectApplication = (id) => {
    const application = applications.find((item) => String(item.applicationId) === id)
    const program = programs.find((item) => item.id === application?.programId)
    setForm((current) => ({ ...current, applicationId: id,
      destinationCountry: program?.country ?? current.destinationCountry,
      degreeLevel: program?.level ?? current.degreeLevel,
      annualTuitionUsd: program?.annualTuitionUsd ?? current.annualTuitionUsd }))
    setResult(null)
  }

  const checkApplication = async () => {
    if (!form.applicationId) return
    setLoading(true); setError('')
    try {
      const report = await apiRequest(`/visa/application/${form.applicationId}/risk`, { token: session.token })
      setResult(report); setToast('Application readiness report loaded')
    } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }

  const evaluate = async (event) => {
    event.preventDefault()
    if (step < steps.length - 1) { setStep(step + 1); return }
    setLoading(true); setError('')
    const payload = {
      ...form,
      applicationId: form.applicationId ? Number(form.applicationId) : null,
      annualTuitionUsd: form.annualTuitionUsd === '' ? null : Number(form.annualTuitionUsd),
      availableFundsUsd: form.availableFundsUsd === '' ? null : Number(form.availableFundsUsd),
      ieltsOverallScore: form.ieltsOverallScore === '' ? null : Number(form.ieltsOverallScore),
      financialAdequacyScore: Number(form.financialAdequacyScore),
      tiesToHomeCountryScore: Number(form.tiesToHomeCountryScore),
    }
    try {
      const report = await apiRequest('/visa/evaluate', {
        token: session.token, method: 'POST', body: JSON.stringify(payload),
      })
      setResult(report); setToast('Assessment ready')
    } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }

  const currentMeter = result ? meter[result.riskLevel] ?? meter.High : null
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-primary-600">Application preparation</p>
        <h1 className="mt-1 text-3xl font-bold text-secondary-950">Visa Check</h1>
        <p className="mt-2 text-secondary-500">Review your study plan and prepare evidence before filing an official visa application.</p>
        <p className="mt-1 text-xs text-secondary-400">This readiness score is a planning aid, not a visa decision or an official requirement.</p>
      </header>

      {error && <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700" role="alert">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <form className={`${CARD} space-y-5 p-5 sm:p-7`} onSubmit={evaluate}>
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-secondary-950">{steps[step]}</h2><span className="text-xs font-medium text-secondary-500">Step {step + 1} of {steps.length}</span></div>
          <div aria-label="Assessment progress" className="flex gap-2">{steps.map((name, index) => <span aria-current={index === step ? 'step' : undefined} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-primary-500' : 'bg-secondary-200'}`} key={name} />)}</div>

          {step === 0 && <div className="space-y-4">
            <Field label="Tracked application (optional)" id="visa-application"><select className={`${CONTROL} w-full`} id="visa-application" onChange={(event) => selectApplication(event.target.value)} value={form.applicationId}><option value="">Assess a new study plan</option>{applications.map((item) => <option key={item.applicationId} value={item.applicationId}>{item.programName} — {item.universityName}</option>)}</select></Field>
            {form.applicationId && <button className={`text-sm font-semibold text-primary-600 hover:underline ${FOCUS}`} disabled={loading} onClick={checkApplication} type="button">View report from saved application details</button>}
            <Field label="Destination country" id="visa-country"><input className={`${CONTROL} w-full`} id="visa-country" maxLength={100} onChange={(event) => update('destinationCountry', event.target.value)} placeholder="e.g. Canada" required value={form.destinationCountry} /></Field>
            <Field label="Degree level" id="visa-degree"><select className={`${CONTROL} w-full`} id="visa-degree" onChange={(event) => update('degreeLevel', event.target.value)} value={form.degreeLevel}>{["Bachelor's", "Master's", 'PhD', 'Diploma', 'Certificate'].map((level) => <option key={level}>{level}</option>)}</select></Field>
            <Field label="Academic major" id="visa-major"><input className={`${CONTROL} w-full`} id="visa-major" maxLength={100} onChange={(event) => update('intendedMajor', event.target.value)} placeholder="e.g. Computer Science" value={form.intendedMajor} /></Field>
          </div>}

          {step === 1 && <div className="space-y-4">
            <Field label="Annual tuition (USD)" id="visa-tuition"><input className={`${CONTROL} w-full`} id="visa-tuition" min="0" onChange={(event) => update('annualTuitionUsd', event.target.value)} step="1" type="number" value={form.annualTuitionUsd} /></Field>
            <Field label="Available funds (USD)" id="visa-funds"><input className={`${CONTROL} w-full`} id="visa-funds" min="0" onChange={(event) => update('availableFundsUsd', event.target.value)} step="1" type="number" value={form.availableFundsUsd} /></Field>
            <Check label="I have bank statements or sponsor funding proof" checked={form.hasFundingProof} onChange={(value) => update('hasFundingProof', value)} />
            <Slider label="How adequate is your financial coverage?" id="visa-financial" value={form.financialAdequacyScore} onChange={(value) => update('financialAdequacyScore', value)} />
          </div>}

          {step === 2 && <div className="space-y-4">
            <Check label="I have a valid language test result" checked={form.hasLanguageScore} onChange={(value) => update('hasLanguageScore', value)} />
            <Field label="IELTS overall score (if applicable)" id="visa-ielts"><input className={`${CONTROL} w-full`} disabled={!form.hasLanguageScore} id="visa-ielts" max="9" min="0" onChange={(event) => update('ieltsOverallScore', event.target.value)} step="0.5" type="number" value={form.ieltsOverallScore} /></Field>
            <p className="text-xs text-secondary-500">Check your program’s accepted tests and required minimum; the tool uses a planning benchmark.</p>
          </div>}

          {step === 3 && <div className="space-y-4">
            <Check label="I have had a previous visa refusal" checked={form.hasPriorVisaRefusal} onChange={(value) => update('hasPriorVisaRefusal', value)} />
            <Slider label="How well can you document ties to your home country?" id="visa-ties" value={form.tiesToHomeCountryScore} onChange={(value) => update('tiesToHomeCountryScore', value)} />
            <p className="text-xs text-secondary-500">Answer honestly. A prior refusal should be disclosed and explained in an official application.</p>
          </div>}

          <div className="flex justify-between gap-3 border-t border-secondary-100 pt-5">
            <button className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-secondary-600 hover:bg-secondary-100 disabled:opacity-40 ${FOCUS}`} disabled={step === 0 || loading} onClick={() => setStep(step - 1)} type="button">Back</button>
            <button className={BTN_PRIMARY} disabled={loading} type="submit">{loading ? 'Calculating…' : step === steps.length - 1 ? 'Calculate readiness' : 'Continue'}</button>
          </div>
        </form>

        <section aria-live="polite" className={`${CARD} space-y-5 p-5 sm:p-7`}>
          <h2 className="text-lg font-bold text-secondary-950">Readiness report</h2>
          {loading && <div className="space-y-3" role="status"><div className="h-3 w-3/4 animate-pulse rounded-full bg-primary-100" /><div className="h-3 w-full animate-pulse rounded-full bg-secondary-100" /><p className="text-sm text-secondary-500">Calculating your risk factors…</p></div>}
          {!loading && !result && <p className="text-sm text-secondary-500">Complete the assessment or view a tracked application report to see your risk factors and checklist.</p>}
          {!loading && result && <>
            <div><div className="flex items-end justify-between"><span className={`text-2xl font-bold ${currentMeter.text}`}>{currentMeter.label} risk</span><span className="text-sm font-semibold text-secondary-700">{result.riskScore}/100</span></div><div aria-label={`Risk score ${result.riskScore} of 100`} className="mt-3 h-3 overflow-hidden rounded-full bg-secondary-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={result.riskScore}><div className={`h-full rounded-full transition-all duration-700 ${currentMeter.color}`} style={{ width: `${result.riskScore}%` }} /></div></div>
            <div><h3 className="font-semibold text-secondary-950">Key risk factors</h3><ul className="mt-3 space-y-3">{result.reasons.map((reason) => <li className="flex gap-2 text-sm text-secondary-700" key={reason}><span aria-hidden="true" className={reason.startsWith('Check destination') ? 'text-success-600' : 'text-warning-600'}>{reason.startsWith('Check destination') ? '✓' : '⚠'}</span><span>{reason}</span></li>)}</ul></div>
            <div><h3 className="font-semibold text-secondary-950">Your next steps</h3><ul className="mt-3 space-y-3">{result.recommendations.map((item) => <li className="flex gap-2 text-sm text-secondary-700" key={item}><span aria-hidden="true" className="text-success-600">✓</span><span>{item}</span></li>)}</ul></div>
          </>}
        </section>
      </div>
      <Toast message={toast} />
    </div>
  )
}

function Field({ label, id, children }) { return <div><label className="mb-1.5 block text-sm font-semibold text-secondary-700" htmlFor={id}>{label}</label>{children}</div> }
function Check({ label, checked, onChange }) { return <label className="flex items-center gap-3 text-sm text-secondary-700"><input checked={checked} className="h-4 w-4 accent-primary-500" onChange={(event) => onChange(event.target.checked)} type="checkbox" />{label}</label> }
function Slider({ label, id, value, onChange }) { return <Field id={id} label={`${label} ${value}/100`}><input className="w-full accent-primary-500" id={id} max="100" min="0" onChange={(event) => onChange(event.target.value)} type="range" value={value} /></Field> }
