import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'

const emptyResult = { featuredCountries: [], programs: [], countries: [], levels: [], totalCount: 0 }

const formatTuition = (amount) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(amount)

const formatDuration = (months) => months % 12 === 0
  ? `${months / 12} year${months === 12 ? '' : 's'}`
  : `${months} months`

export default function Discovery({ session }) {
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [level, setLevel] = useState('')
  const [result, setResult] = useState(emptyResult)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingIds, setSavingIds] = useState(() => new Set())
  const [savedPrograms, setSavedPrograms] = useState([])
  const [showComparison, setShowComparison] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const loadPrograms = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (query.trim()) params.set('query', query.trim())
    if (country) params.set('country', country)
    if (level) params.set('level', level)

    try {
      const data = await apiRequest(`/discovery?${params}`, { token: session.token, signal })
      setResult(data)
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message)
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [country, level, query, session.token])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => loadPrograms(controller.signal), 250)
    return () => { clearTimeout(timer); controller.abort() }
  }, [loadPrograms, reloadKey])

  useEffect(() => {
    let active = true
    apiRequest('/discovery/saved', { token: session.token })
      .then((programs) => { if (active) setSavedPrograms(programs) })
      .catch((requestError) => { if (active) setError(requestError.message) })
    return () => { active = false }
  }, [reloadKey, session.token])

  const toggleSaved = async (program) => {
    if (savingIds.has(program.id)) return
    const nextSaved = !program.isSaved
    setSavingIds((current) => new Set(current).add(program.id))
    setResult((current) => ({
      ...current,
      programs: current.programs.map((item) => item.id === program.id ? { ...item, isSaved: nextSaved } : item),
    }))
    setSavedPrograms((current) => nextSaved
      ? [...current.filter((item) => item.id !== program.id), { ...program, isSaved: true }]
      : current.filter((item) => item.id !== program.id))

    try {
      await apiRequest(`/discovery/saved/${program.id}`, {
        token: session.token,
        method: nextSaved ? 'PUT' : 'DELETE',
      })
    } catch (requestError) {
      setResult((current) => ({
        ...current,
        programs: current.programs.map((item) => item.id === program.id ? { ...item, isSaved: program.isSaved } : item),
      }))
      setSavedPrograms((current) => program.isSaved
        ? [...current.filter((item) => item.id !== program.id), program]
        : current.filter((item) => item.id !== program.id))
      setError(requestError.message)
    } finally {
      setSavingIds((current) => {
        const next = new Set(current)
        next.delete(program.id)
        return next
      })
    }
  }

  const clearFilters = () => { setQuery(''); setCountry(''); setLevel('') }
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-6 py-10 text-white shadow-lg sm:px-10">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-50">Your study journey starts here</span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">Find a program that feels made for you.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-50 sm:text-lg">Compare universities, understand costs, and discover destinations that match your ambitions.</p>
          <label className="mt-7 flex max-w-2xl items-center gap-3 rounded-xl bg-white p-2 pl-4 shadow-xl shadow-emerald-950/20" htmlFor="program-search">
            <span aria-hidden="true" className="text-gray-400">⌕</span>
            <span className="sr-only">Search programs</span>
            <input className="min-w-0 flex-1 bg-transparent py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 sm:text-base" id="program-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search by program, university, or destination" type="search" value={query} />
            <span className="hidden rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white sm:block">Search</span>
          </label>
        </div>
      </section>

      <section aria-labelledby="destinations-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div><p className="text-sm font-semibold text-emerald-700">Popular destinations</p><h2 className="mt-1 text-2xl font-bold text-gray-950" id="destinations-title">Explore by country</h2></div>
          <button className="hidden text-sm font-semibold text-emerald-700 hover:text-emerald-900 sm:block" onClick={() => setCountry('')} type="button">View all destinations →</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {result.featuredCountries.map((item) => (
            <button className={`group rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${country === item.name ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-200 hover:border-emerald-200'}`} key={item.id} onClick={() => setCountry(country === item.name ? '' : item.name)} type="button">
              <div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-lg font-bold text-emerald-700">{item.code}</div><span aria-hidden="true">→</span></div>
              <h3 className="mt-5 font-bold text-gray-950">{item.name}</h3><p className="mt-1 text-sm text-gray-500">{item.description}</p><p className="mt-4 text-xs font-semibold text-emerald-700">{item.programCount} program{item.programCount === 1 ? '' : 's'}</p>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="programs-title">
        <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="text-sm font-semibold text-emerald-700">Curated for students</p><h2 className="mt-1 text-2xl font-bold text-gray-950" id="programs-title">Featured programs</h2><p className="mt-1 text-sm text-gray-500">{loading ? 'Finding programs…' : `${result.totalCount} program${result.totalCount === 1 ? '' : 's'} found`}</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="country-filter">Filter by country</label>
            <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:border-emerald-500" id="country-filter" onChange={(event) => setCountry(event.target.value)} value={country}><option value="">All countries</option>{result.countries.map((name) => <option key={name}>{name}</option>)}</select>
            <label className="sr-only" htmlFor="level-filter">Filter by study level</label>
            <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:border-emerald-500" id="level-filter" onChange={(event) => setLevel(event.target.value)} value={level}><option value="">All levels</option>{result.levels.map((name) => <option key={name}>{name}</option>)}</select>
          </div>
        </div>

        {error && <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert"><span>{error}</span><button className="font-semibold underline" onClick={() => setReloadKey((key) => key + 1)} type="button">Try again</button></div>}
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2" aria-label="Loading programs">{[1, 2, 3, 4].map((item) => <div className="h-56 animate-pulse rounded-2xl bg-gray-200" key={item} />)}</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {result.programs.map((item) => (
              <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" key={item.id}>
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{item.country} · {item.city}</p><h3 className="mt-2 text-lg font-bold text-gray-950">{item.name}</h3><p className="mt-1 text-sm text-gray-600">{item.university}</p></div><div className="flex shrink-0 items-center gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{item.matchScore}% match</span><button aria-label={`${item.isSaved ? 'Remove' : 'Add'} ${item.name} ${item.isSaved ? 'from' : 'to'} shortlist`} className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm transition disabled:opacity-50 ${item.isSaved ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-200 text-gray-400 hover:border-emerald-300 hover:text-emerald-700'}`} disabled={savingIds.has(item.id)} onClick={() => toggleSaved(item)} type="button">{item.isSaved ? '♥' : '♡'}</button></div></div>
                <div className="mt-5 flex flex-wrap gap-2">{item.tags.map((tag) => <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600" key={tag}>{tag}</span>)}</div>
                <div className="mt-5 grid grid-cols-3 border-t border-gray-100 pt-4 text-sm"><div><p className="text-xs text-gray-400">Tuition</p><p className="mt-1 font-semibold text-gray-700">{formatTuition(item.annualTuitionUsd)}/year</p></div><div><p className="text-xs text-gray-400">Duration</p><p className="mt-1 font-semibold text-gray-700">{formatDuration(item.durationMonths)}</p></div><div><p className="text-xs text-gray-400">Level</p><p className="mt-1 font-semibold text-gray-700">{item.level}</p></div></div>
              </article>
            ))}
          </div>
        )}
        {!loading && result.programs.length === 0 && <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center"><p className="font-semibold text-gray-900">No programs found</p><p className="mt-1 text-sm text-gray-500">Try a different program, university, or destination.</p><button className="mt-4 text-sm font-semibold text-emerald-700" onClick={clearFilters} type="button">Clear all filters</button></div>}
      </section>

      <aside className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between" aria-live="polite"><div><p className="font-bold text-emerald-950">Your discovery shortlist</p><p className="mt-1 text-sm text-emerald-800">{savedPrograms.length === 0 ? 'Save programs to compare your best options.' : `${savedPrograms.length} program${savedPrograms.length === 1 ? '' : 's'} saved for comparison.`}</p></div><button className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={savedPrograms.length === 0} onClick={() => setShowComparison(true)} type="button">Compare saved programs</button></aside>

      {showComparison && <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/55 p-4 sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowComparison(false) }} role="presentation"><section aria-labelledby="compare-title" aria-modal="true" className="max-h-[85vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl" role="dialog"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-emerald-700">Side-by-side view</p><h2 className="mt-1 text-2xl font-bold text-gray-950" id="compare-title">Compare your shortlist</h2></div><button aria-label="Close comparison" className="rounded-lg border border-gray-200 px-3 py-1.5 text-gray-500 hover:bg-gray-50" onClick={() => setShowComparison(false)} type="button">Close</button></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{savedPrograms.map((item) => <article className="rounded-xl border border-gray-200 p-4" key={item.id}><p className="text-xs font-semibold text-emerald-700">{item.country}</p><h3 className="mt-2 font-bold text-gray-950">{item.name}</h3><p className="mt-1 text-sm text-gray-500">{item.university}</p><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-gray-500">Tuition</dt><dd className="font-semibold">{formatTuition(item.annualTuitionUsd)}</dd></div><div className="flex justify-between gap-4"><dt className="text-gray-500">Duration</dt><dd className="font-semibold">{formatDuration(item.durationMonths)}</dd></div><div className="flex justify-between gap-4"><dt className="text-gray-500">Match</dt><dd className="font-semibold text-emerald-700">{item.matchScore}%</dd></div></dl></article>)}</div></section></div>}
    </div>
  )
}
