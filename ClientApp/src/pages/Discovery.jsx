import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'
import { useAiSearch } from '../lib/useAiSearch.js'

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

  const { classify, status: aiStatus, error: aiWorkerError } = useAiSearch()
  const [aiQuery, setAiQuery] = useState('')
  const [aiMatches, setAiMatches] = useState(null)
  const [aiError, setAiError] = useState('')

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

  // Natural-language ranking. Entirely additive: every failure path below leaves the
  // keyword/country/level search above completely untouched.
  const runAiSearch = async (event) => {
    event.preventDefault()
    if (!aiQuery.trim() || result.programs.length === 0) return
    setAiError('')
    try {
      setAiMatches(await classify(aiQuery, result.programs))
    } catch (searchError) {
      setAiMatches(null)
      setAiError(searchError.message)
    }
  }

  const clearAiSearch = () => { setAiQuery(''); setAiMatches(null); setAiError('') }

  // Ranked order when a natural-language search has run, otherwise the server's order.
  // Falls back to result.programs on every AI failure path, so the grid never breaks.
  const displayedPrograms = aiMatches ?? result.programs
  const aiUnavailable = aiStatus === 'error'
  const aiBusy = aiStatus === 'loading-model' || aiStatus === 'classifying'

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-700 to-primary-400 px-6 py-10 text-white shadow-[0_1px_2px_rgba(27,36,50,0.04),0_6px_20px_-8px_rgba(27,36,50,0.10)] sm:px-10">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-50">Your study journey starts here</span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">Find a program that feels made for you.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-primary-50 sm:text-lg">Compare universities, understand costs, and discover destinations that match your ambitions.</p>
          <label className="mt-7 flex max-w-2xl items-center gap-3 rounded-2xl bg-white p-2 pl-4 shadow-[0_1px_2px_rgba(27,36,50,0.04),0_6px_20px_-8px_rgba(27,36,50,0.10)]" htmlFor="program-search">
            <span aria-hidden="true" className="text-secondary-400">⌕</span>
            <span className="sr-only">Search programs</span>
            <input className="min-w-0 flex-1 bg-transparent py-2 text-sm text-secondary-900 outline-none placeholder:text-secondary-400 sm:text-base" id="program-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search by program, university, or destination" type="search" value={query} />
            <span className="hidden rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white sm:block">Search</span>
          </label>
        </div>
      </section>

      {/* Natural-language search. Additive to the filters above — if the model cannot
          load, this block degrades to a notice and nothing else on the page changes. */}
      <section aria-labelledby="ai-search-title" className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-secondary-950" id="ai-search-title">Describe what you&rsquo;re looking for</h2>
          {aiMatches && (
            <button className="rounded-lg px-2 py-1 text-sm font-semibold text-primary-600 hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" onClick={clearAiSearch} type="button">
              Clear matches
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-secondary-500">
          Write it in your own words &mdash; we&rsquo;ll rank the programs below by how well they fit.
        </p>

        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={runAiSearch}>
          <label className="sr-only" htmlFor="ai-search-input">Describe what you&rsquo;re looking for</label>
          <input
            className="min-w-0 flex-1 rounded-lg border border-secondary-200 px-3 py-2.5 text-sm text-secondary-950 outline-none transition placeholder:text-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:bg-secondary-50"
            disabled={aiUnavailable}
            id="ai-search-input"
            onChange={(event) => setAiQuery(event.target.value)}
            placeholder="e.g. affordable STEM programs in Europe"
            type="text"
            value={aiQuery}
          />
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={aiBusy || aiUnavailable || !aiQuery.trim()}
            type="submit"
          >
            {aiBusy ? 'Working…' : 'Find matches'}
          </button>
        </form>

        <div aria-live="polite" className="mt-3 min-h-[1.25rem]">
          {aiStatus === 'loading-model' && (
            <p className="text-sm font-medium text-secondary-600">
              Loading smart search &mdash; this only happens the first time, then it&rsquo;s cached.
            </p>
          )}
          {aiStatus === 'classifying' && <p className="text-sm font-medium text-secondary-600">Ranking programs&hellip;</p>}
          {aiMatches && !aiBusy && (
            <p className="text-sm text-secondary-600">
              Ranked {aiMatches.length} program{aiMatches.length === 1 ? '' : 's'} by fit. Best matches are shown first below.
            </p>
          )}
        </div>

        {(aiError || aiUnavailable) && (
          <div className="mt-3 rounded-lg border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700" role="alert">
            Smart search is unavailable{aiWorkerError || aiError ? ` (${aiWorkerError || aiError})` : ''}. The search box
            and filters below work as usual.
          </div>
        )}

        {aiStatus === 'loading-model' && (
          <div className="mt-4 grid gap-2" aria-hidden="true">
            {[1, 2, 3].map((row) => <div className="h-4 animate-pulse rounded bg-secondary-100" key={row} />)}
          </div>
        )}
      </section>

      <section aria-labelledby="destinations-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div><p className="text-sm font-semibold text-primary-600">Popular destinations</p><h2 className="mt-1 text-2xl font-bold text-secondary-950" id="destinations-title">Explore by country</h2></div>
          <button className="hidden min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 hover:text-primary-800 sm:inline-flex" onClick={() => setCountry('')} type="button">View all destinations →</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {result.featuredCountries.map((item) => (
            <button className={`group rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(27,36,50,0.04),0_6px_20px_-8px_rgba(27,36,50,0.10)] ${country === item.name ? 'border-primary-500 ring-2 ring-primary-100' : 'border-secondary-200 hover:border-primary-200'}`} key={item.id} onClick={() => setCountry(country === item.name ? '' : item.name)} type="button">
              <div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-lg font-bold text-primary-600">{item.code}</div><span aria-hidden="true">→</span></div>
              <h3 className="mt-5 font-bold text-secondary-950">{item.name}</h3><p className="mt-1 text-sm text-secondary-500">{item.description}</p><p className="mt-4 text-xs font-semibold text-primary-600">{item.programCount} program{item.programCount === 1 ? '' : 's'}</p>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="programs-title">
        <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="text-sm font-semibold text-primary-600">{aiMatches ? 'Ranked by your description' : 'Curated for students'}</p><h2 className="mt-1 text-2xl font-bold text-secondary-950" id="programs-title">{aiMatches ? 'Best matches' : 'Featured programs'}</h2><p className="mt-1 text-sm text-secondary-500">{loading ? 'Finding programs…' : `${result.totalCount} program${result.totalCount === 1 ? '' : 's'} found`}</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="country-filter">Filter by country</label>
            <select className="rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm font-medium text-secondary-700 outline-none focus:border-primary-500" id="country-filter" onChange={(event) => setCountry(event.target.value)} value={country}><option value="">All countries</option>{result.countries.map((name) => <option key={name}>{name}</option>)}</select>
            <label className="sr-only" htmlFor="level-filter">Filter by study level</label>
            <select className="rounded-lg border border-secondary-200 bg-white px-3 py-2 text-sm font-medium text-secondary-700 outline-none focus:border-primary-500" id="level-filter" onChange={(event) => setLevel(event.target.value)} value={level}><option value="">All levels</option>{result.levels.map((name) => <option key={name}>{name}</option>)}</select>
          </div>
        </div>

        {error && <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert"><span>{error}</span><button className="font-semibold underline" onClick={() => setReloadKey((key) => key + 1)} type="button">Try again</button></div>}
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2" aria-label="Loading programs">{[1, 2, 3, 4].map((item) => <div className="h-56 animate-pulse rounded-2xl bg-secondary-200" key={item} />)}</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {displayedPrograms.map((item) => (
              <article className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm" key={item.id}>
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary-600">{item.country} · {item.city}</p><h3 className="mt-2 text-lg font-bold text-secondary-950">{item.name}</h3><p className="mt-1 text-sm text-secondary-600">{item.university}</p></div><div className="flex shrink-0 items-center gap-2">{typeof item.aiScore === 'number' && <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-bold text-accent-600" title="How well this fits your description">{Math.round(item.aiScore * 100)}% fit</span>}<span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-600">{item.matchScore}% match</span><button aria-label={`${item.isSaved ? 'Remove' : 'Add'} ${item.name} ${item.isSaved ? 'from' : 'to'} shortlist`} className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm transition disabled:opacity-50 ${item.isSaved ? 'border-primary-500 bg-primary-500 text-white' : 'border-secondary-200 text-secondary-400 hover:border-primary-300 hover:text-primary-600'}`} disabled={savingIds.has(item.id)} onClick={() => toggleSaved(item)} type="button">{item.isSaved ? '♥' : '♡'}</button></div></div>
                <div className="mt-5 flex flex-wrap gap-2">{item.tags.map((tag) => <span className="rounded-lg bg-secondary-100 px-2.5 py-1 text-xs font-medium text-secondary-600" key={tag}>{tag}</span>)}</div>
                <div className="mt-5 grid grid-cols-3 border-t border-secondary-100 pt-4 text-sm"><div><p className="text-xs text-secondary-400">Tuition</p><p className="mt-1 font-semibold text-secondary-700">{formatTuition(item.annualTuitionUsd)}/year</p></div><div><p className="text-xs text-secondary-400">Duration</p><p className="mt-1 font-semibold text-secondary-700">{formatDuration(item.durationMonths)}</p></div><div><p className="text-xs text-secondary-400">Level</p><p className="mt-1 font-semibold text-secondary-700">{item.level}</p></div></div>
              </article>
            ))}
          </div>
        )}
        {!loading && result.programs.length === 0 && <div className="rounded-2xl border border-dashed border-secondary-300 bg-white px-6 py-12 text-center"><p className="font-semibold text-secondary-900">No programs found</p><p className="mt-1 text-sm text-secondary-500">Try a different program, university, or destination.</p><button className="mt-4 text-sm font-semibold text-primary-600" onClick={clearFilters} type="button">Clear all filters</button></div>}
      </section>

      <aside className="flex flex-col gap-4 rounded-2xl border border-primary-100 bg-primary-50 p-5 sm:flex-row sm:items-center sm:justify-between" aria-live="polite"><div><p className="font-bold text-primary-900">Your discovery shortlist</p><p className="mt-1 text-sm text-primary-700">{savedPrograms.length === 0 ? 'Save programs to compare your best options.' : `${savedPrograms.length} program${savedPrograms.length === 1 ? '' : 's'} saved for comparison.`}</p></div><button className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={savedPrograms.length === 0} onClick={() => setShowComparison(true)} type="button">Compare saved programs</button></aside>

      {showComparison && <div className="fixed inset-0 z-50 flex items-end justify-center bg-secondary-950/55 p-4 sm:items-center" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowComparison(false) }} role="presentation"><section aria-labelledby="compare-title" aria-modal="true" className="max-h-[85vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-6 shadow-[0_12px_32px_-8px_rgba(27,36,50,0.24)]" role="dialog"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-primary-600">Side-by-side view</p><h2 className="mt-1 text-2xl font-bold text-secondary-950" id="compare-title">Compare your shortlist</h2></div><button aria-label="Close comparison" className="rounded-lg border border-secondary-200 px-3 py-1.5 text-secondary-500 hover:bg-secondary-50" onClick={() => setShowComparison(false)} type="button">Close</button></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{savedPrograms.map((item) => <article className="rounded-2xl border border-secondary-200 p-4" key={item.id}><p className="text-xs font-semibold text-primary-600">{item.country}</p><h3 className="mt-2 font-bold text-secondary-950">{item.name}</h3><p className="mt-1 text-sm text-secondary-500">{item.university}</p><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-secondary-500">Tuition</dt><dd className="font-semibold">{formatTuition(item.annualTuitionUsd)}</dd></div><div className="flex justify-between gap-4"><dt className="text-secondary-500">Duration</dt><dd className="font-semibold">{formatDuration(item.durationMonths)}</dd></div><div className="flex justify-between gap-4"><dt className="text-secondary-500">Match</dt><dd className="font-semibold text-primary-600">{item.matchScore}%</dd></div></dl></article>)}</div></section></div>}
    </div>
  )
}
