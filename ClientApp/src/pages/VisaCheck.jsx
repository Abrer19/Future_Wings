import { useMemo, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { BTN_PRIMARY, CARD, CONTROL, FOCUS } from '../components/ui/styles.js'

const STEPS = ['Study plan', 'Readiness', 'Visa history']
const initialForm = { destinationCountry: 'Canada', degreeLevel: 'Master', hasFundingProof: false, financialAdequacyScore: 60, hasLanguageScore: false, languageTestScore: '', tiesToHomeCountryScore: 60, hasPriorVisaRefusal: false }

function Choice({ checked, children, onClick }) {
  return <button aria-pressed={checked} className={`min-h-11 rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${FOCUS} ${checked ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-secondary-200 text-secondary-700 hover:border-secondary-300'}`} onClick={onClick} type="button">{children}</button>
}

function StatusIcon({ good }) {
  return <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${good ? 'bg-success-50 text-success-600' : 'bg-amber-50 text-amber-600'}`}><svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24">{good ? <path d="m5 12 4 4L19 6" /> : <><path d="M12 9v4M12 17h.01" /><path d="M10.3 4.6 2.8 17.5A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.5L13.7 4.6a2 2 0 0 0-3.4 0Z" /></>}</svg></span>
}

export default function VisaCheck({ session }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const update = (name, value) => { setForm((current) => ({ ...current, [name]: value })); setResult(null) }

  const preview = useMemo(() => {
    let score = form.destinationCountry === 'United States' ? 14 : 10
    if (!form.hasFundingProof) score += 22
    else if (form.financialAdequacyScore < 80) score += form.financialAdequacyScore < 60 ? 18 : 10
    if (!form.hasLanguageScore || form.languageTestScore === '') score += 18
    else if (Number(form.languageTestScore) < 6.5) score += 14
    if (form.tiesToHomeCountryScore < 50) score += 13
    if (form.hasPriorVisaRefusal) score += 15
    return Math.min(score, 100)
  }, [form])
  const riskScore = Number(result?.riskScore ?? preview)
  const riskLevel = result?.riskLevel ?? (riskScore < 35 ? 'Low' : riskScore < 65 ? 'Medium' : 'High')
  const tone = riskLevel === 'Low' ? 'bg-success-500' : riskLevel === 'High' ? 'bg-danger-500' : 'bg-amber-500'

  const submit = async () => {
    setLoading(true); setError(''); setToast('')
    try {
      const body = { ...form, languageTestScore: form.hasLanguageScore && form.languageTestScore !== '' ? Number(form.languageTestScore) : null }
      const data = await apiRequest('/visa/evaluate', { method: 'POST', token: session.token, body: JSON.stringify(body) })
      setResult(data); setToast('Your visa readiness assessment is ready.')
      window.setTimeout(() => setToast(''), 3500)
    } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }

  const factors = result?.reasons ?? [form.hasFundingProof ? 'Funding evidence will be assessed against expected costs.' : 'Funding evidence is not yet documented.', form.hasLanguageScore ? 'Your reported language result will be checked.' : 'No language-test result has been added.', form.hasPriorVisaRefusal ? 'A prior refusal needs explanation and remediation.' : 'No prior visa refusal reported.']

  return <div className="mx-auto max-w-6xl space-y-6">
    <header><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-600">Visa readiness</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-secondary-950 sm:text-3xl">Visa Assessment Tool</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-secondary-500">Identify gaps before you file. This advisory score is not a guarantee of an official visa decision.</p></header>
    <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      <section className={`${CARD} p-5 sm:p-6`}>
        <ol className="mb-7 grid grid-cols-3 gap-2" aria-label="Assessment progress">{STEPS.map((name, index) => <li className="min-w-0" key={name}><div className={`h-1.5 rounded-full ${index <= step ? 'bg-primary-500' : 'bg-secondary-100'}`} /><p className={`mt-2 truncate text-xs font-semibold ${index === step ? 'text-primary-700' : 'text-secondary-400'}`}>{index + 1}. {name}</p></li>)}</ol>
        {step === 0 && <div className="space-y-5"><div><label className="mb-1.5 block text-sm font-semibold text-secondary-800" htmlFor="destination">Destination country</label><select className={`${CONTROL} w-full`} id="destination" onChange={(e) => update('destinationCountry', e.target.value)} value={form.destinationCountry}>{['Australia', 'Canada', 'France', 'Germany', 'United Kingdom', 'United States'].map((value) => <option key={value}>{value}</option>)}</select></div><div><label className="mb-1.5 block text-sm font-semibold text-secondary-800" htmlFor="degree">Degree level</label><select className={`${CONTROL} w-full`} id="degree" onChange={(e) => update('degreeLevel', e.target.value)} value={form.degreeLevel}>{['Bachelor', 'Master', 'PhD'].map((value) => <option key={value}>{value}</option>)}</select></div></div>}
        {step === 1 && <div className="space-y-6"><fieldset><legend className="mb-2 text-sm font-semibold text-secondary-800">Do you have verifiable funding evidence?</legend><div className="grid gap-2 sm:grid-cols-2"><Choice checked={form.hasFundingProof} onClick={() => update('hasFundingProof', true)}>Yes, documents are ready</Choice><Choice checked={!form.hasFundingProof} onClick={() => update('hasFundingProof', false)}>Not yet</Choice></div></fieldset>{form.hasFundingProof && <Range id="funds" label="Coverage of tuition + living costs" value={form.financialAdequacyScore} onChange={(value) => update('financialAdequacyScore', value)} />}<fieldset><legend className="mb-2 text-sm font-semibold text-secondary-800">Do you have a valid language-test score?</legend><div className="grid gap-2 sm:grid-cols-2"><Choice checked={form.hasLanguageScore} onClick={() => update('hasLanguageScore', true)}>Yes</Choice><Choice checked={!form.hasLanguageScore} onClick={() => update('hasLanguageScore', false)}>No</Choice></div></fieldset>{form.hasLanguageScore && <div><label className="mb-1.5 block text-sm font-semibold text-secondary-800" htmlFor="language">IELTS-equivalent score</label><input className={`${CONTROL} w-full`} id="language" max="9" min="0" onChange={(e) => update('languageTestScore', e.target.value)} placeholder="e.g. 6.5" step="0.5" type="number" value={form.languageTestScore} /></div>}</div>}
        {step === 2 && <div className="space-y-6"><fieldset><legend className="mb-2 text-sm font-semibold text-secondary-800">Have you had a prior visa refusal?</legend><div className="grid gap-2 sm:grid-cols-2"><Choice checked={!form.hasPriorVisaRefusal} onClick={() => update('hasPriorVisaRefusal', false)}>No prior refusal</Choice><Choice checked={form.hasPriorVisaRefusal} onClick={() => update('hasPriorVisaRefusal', true)}>Yes, previously refused</Choice></div></fieldset><Range id="ties" label="Strength of home-country ties" value={form.tiesToHomeCountryScore} onChange={(value) => update('tiesToHomeCountryScore', value)} /></div>}
        {error && <div className="mt-5 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700" role="alert">{error}</div>}
        <div className="mt-8 flex justify-between gap-3"><button className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-secondary-600 hover:bg-secondary-100 disabled:opacity-40 ${FOCUS}`} disabled={step === 0 || loading} onClick={() => setStep((value) => value - 1)} type="button">Back</button>{step < 2 ? <button className={BTN_PRIMARY} onClick={() => setStep((value) => value + 1)} type="button">Continue</button> : <button className={BTN_PRIMARY} disabled={loading} onClick={submit} type="button">{loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Calculating…</> : 'Calculate risk'}</button>}</div>
      </section>
      <aside className="space-y-6"><section className={`${CARD} p-5`} aria-live="polite"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-secondary-400">Live risk meter</p><p className="mt-1 text-2xl font-bold text-secondary-950">{riskLevel === 'Medium' ? 'Moderate' : riskLevel}</p></div><span className="text-3xl font-bold tabular-nums text-secondary-900">{riskScore}<span className="text-sm text-secondary-400">/100</span></span></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-secondary-100"><div className={`h-full rounded-full transition-all duration-700 ${tone}`} style={{ width: `${riskScore}%` }} /></div><div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-wide text-secondary-400"><span>Low</span><span>Moderate</span><span>High</span></div></section><section className={`${CARD} p-5`}><h2 className="font-bold text-secondary-950">Key risk factors</h2><ul className="mt-4 space-y-3">{factors.map((factor) => { const good = /adequate|meets|consistent|No prior/i.test(factor); return <li className="flex gap-3 text-sm leading-5 text-secondary-600" key={factor}><StatusIcon good={good} /><span>{factor}</span></li> })}</ul></section></aside>
    </div>
    {result && <section className={`${CARD} p-5 sm:p-6`}><h2 className="text-lg font-bold text-secondary-950">Personalized readiness checklist</h2><p className="mt-1 text-sm text-secondary-500">Complete these actions before submitting an official application.</p><ul className="mt-5 grid gap-3 md:grid-cols-2">{result.recommendations.map((item, index) => <li className="flex gap-3 rounded-lg bg-secondary-50 p-4 text-sm leading-5 text-secondary-700" key={item}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">{index + 1}</span>{item}</li>)}</ul></section>}
    <Toast message={toast} />
  </div>
}

function Range({ id, label, onChange, value }) {
  return <div><label className="flex justify-between text-sm font-semibold text-secondary-800" htmlFor={id}><span>{label}</span><span>{value}%</span></label><input className="mt-3 w-full accent-primary-500" id={id} max="100" min="0" onChange={(event) => onChange(Number(event.target.value))} type="range" value={value} /></div>
}
