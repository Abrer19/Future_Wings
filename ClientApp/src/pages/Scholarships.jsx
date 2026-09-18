import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { BTN_PRIMARY, BTN_QUIET, CARD, CONTROL, FOCUS } from '../components/ui/styles.js'

const flag = (name) => ({ Canada: '🇨🇦', 'United States': '🇺🇸', 'United Kingdom': '🇬🇧', Germany: '🇩🇪', Australia: '🇦🇺', France: '🇫🇷', Japan: '🇯🇵', Singapore: '🇸🇬', Sweden: '🇸🇪', Switzerland: '🇨🇭', Netherlands: '🇳🇱', Ireland: '🇮🇪', Finland: '🇫🇮' }[name] ?? '🌍')
const money = (amount) => amount == null ? 'Amount varies' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
const date = (value) => value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value)) : 'Rolling deadline'

export default function Scholarships({ session, onNavigate }) {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [countryId, setCountryId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(() => new Set())
  const [toast, setToast] = useState('')

  const load = useCallback(async (signal) => {
    setLoading(true); setError('')
    const params = new URLSearchParams()
    if (query.trim()) params.set('search', query.trim())
    if (countryId) params.set('countryId', countryId)
    try { setItems(await apiRequest(`/scholarship?${params}`, { token: session.token, signal })) }
    catch (requestError) { if (requestError.name !== 'AbortError') setError(requestError.message) }
    finally { if (!signal.aborted) setLoading(false) }
  }, [countryId, query, session.token])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => load(controller.signal), 250)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [load])

  const countries = useMemo(() => {
    const unique = new Map(items.map((item) => [item.countryId, item.countryName]))
    return [...unique].sort((a, b) => a[1].localeCompare(b[1]))
  }, [items])
  const maximumAward = Math.max(0, ...items.map((item) => item.awardAmount ?? 0))

  const addDeadline = async (item) => {
    if (!item.deadline || adding.has(item.id)) return
    setAdding((current) => new Set(current).add(item.id)); setError('')
    try {
      await apiRequest('/deadlines', { token: session.token, method: 'POST', body: JSON.stringify({ title: item.name, category: 'Scholarship', notes: `${item.countryName} · ${item.eligibilityCriteria}`, dueAt: item.deadline }) })
      setToast(`${item.name} added to your deadlines.`)
      window.setTimeout(() => setToast(''), 3500)
    } catch (requestError) { setError(requestError.message) }
    finally { setAdding((current) => { const next = new Set(current); next.delete(item.id); return next }) }
  }

  return <div className="mx-auto max-w-7xl space-y-7">
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-700 to-primary-400 px-6 py-9 text-white sm:px-10">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-100">Funding directory</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Fund your study-abroad journey.</h1><p className="mt-3 max-w-2xl text-primary-50">Search verified opportunities by destination, compare awards, and keep every application deadline in one place.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px]"><label className="sr-only" htmlFor="scholarship-search">Search scholarships</label><input className={`${CONTROL} w-full`} id="scholarship-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search scholarship or country" type="search" value={query} /><label className="sr-only" htmlFor="scholarship-country">Filter by country</label><select className={CONTROL} id="scholarship-country" onChange={(event) => setCountryId(event.target.value)} value={countryId}><option value="">All countries</option>{countries.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></div>
    </section>

    <section className="grid gap-4 sm:grid-cols-2"><div className={`${CARD} p-5`}><p className="text-xs font-bold uppercase tracking-wider text-secondary-400">Total opportunities</p><p className="mt-2 text-3xl font-bold text-secondary-950">{loading ? '—' : items.length}</p></div><div className={`${CARD} p-5`}><p className="text-xs font-bold uppercase tracking-wider text-secondary-400">Maximum award</p><p className="mt-2 text-3xl font-bold text-primary-700">{loading ? '—' : money(maximumAward)}</p></div></section>
    {error && <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700" role="alert">{error}</div>}
    {loading ? <div aria-label="Loading scholarships" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div className="h-64 animate-pulse rounded-2xl bg-secondary-200" key={item} />)}</div> : items.length === 0 ? <section className={`${CARD} border-dashed px-6 py-14 text-center`}><p className="font-bold text-secondary-900">No scholarships found</p><p className="mt-1 text-sm text-secondary-500">Try another scholarship name or destination.</p><button className={`${BTN_QUIET} mt-3`} onClick={() => { setQuery(''); setCountryId('') }} type="button">Clear filters</button></section> : <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article className={`${CARD} flex flex-col p-5`} key={item.id}><div className="flex items-start justify-between gap-3"><span className="text-3xl" title={item.countryName}>{flag(item.countryName)}</span><span className="rounded-full bg-success-50 px-3 py-1 text-xs font-bold text-success-700">{money(item.awardAmount)}</span></div><p className="mt-4 text-xs font-bold uppercase tracking-wide text-primary-600">{item.countryName}</p><h2 className="mt-1 text-lg font-bold leading-6 text-secondary-950">{item.name}</h2><p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-secondary-500">{item.eligibilityCriteria}</p><div className="mt-5 border-t border-secondary-100 pt-4"><p className="text-xs text-secondary-400">Application deadline</p><p className="mt-1 text-sm font-semibold text-secondary-800">{date(item.deadline)}</p><div className="mt-4 flex gap-2"><button className={`${BTN_PRIMARY} flex-1`} disabled={!item.deadline || adding.has(item.id)} onClick={() => addDeadline(item)} type="button">{adding.has(item.id) ? 'Adding…' : 'Add to Deadlines'}</button><button aria-label="Open deadlines" className={`${BTN_QUIET} ${FOCUS}`} onClick={() => onNavigate('Dashboard')} type="button">View</button></div></div></article>)}</section>}
    <Toast message={toast} />
  </div>
}
