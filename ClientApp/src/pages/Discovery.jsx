import { useMemo, useState } from 'react'
import { discoveryCountries, discoveryPrograms } from '../data/discoveryPrograms.js'

function ArrowIcon() {
  return <span aria-hidden="true">→</span>
}

export default function Discovery() {
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('All countries')
  const [level, setLevel] = useState('All levels')
  const [savedPrograms, setSavedPrograms] = useState(() => new Set())
  const filteredPrograms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return discoveryPrograms.filter((item) => {
      const matchesQuery = !normalizedQuery || [item.university, item.program, item.country, item.city, ...item.tags]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
      const matchesCountry = country === 'All countries' || item.country === country
      const matchesLevel = level === 'All levels' || item.level === level
      return matchesQuery && matchesCountry && matchesLevel
    })
  }, [country, level, query])

  const toggleSaved = (programId) => {
    setSavedPrograms((current) => {
      const next = new Set(current)
      if (next.has(programId)) next.delete(programId)
      else next.add(programId)
      return next
    })
  }

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
            <input
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 sm:text-base"
              id="program-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by program, university, or destination"
              type="search"
              value={query}
            />
            <span className="hidden rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white sm:block">Search</span>
          </label>
        </div>
      </section>

      <section aria-labelledby="destinations-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Popular destinations</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-950" id="destinations-title">Explore by country</h2>
          </div>
          <button className="hidden text-sm font-semibold text-emerald-700 hover:text-emerald-900 sm:block" type="button">View all destinations <ArrowIcon /></button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {discoveryCountries.map((country) => (
            <article className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md" key={country.name}>
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-lg font-bold text-emerald-700">{country.name.slice(0, 2).toUpperCase()}</div>
                <ArrowIcon />
              </div>
              <h3 className="mt-5 font-bold text-gray-950">{country.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{country.note}</p>
              <p className="mt-4 text-xs font-semibold text-emerald-700">{country.programs} programs</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="programs-title">
        <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Curated for students</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-950" id="programs-title">Featured programs</h2>
            <p className="mt-1 text-sm text-gray-500">Showing {filteredPrograms.length} of {discoveryPrograms.length} programs</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="country-filter">Filter by country</label>
            <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:border-emerald-500" id="country-filter" onChange={(event) => setCountry(event.target.value)} value={country}>
              <option>All countries</option>
              {[...new Set(discoveryPrograms.map((item) => item.country))].map((name) => <option key={name}>{name}</option>)}
            </select>
            <label className="sr-only" htmlFor="level-filter">Filter by study level</label>
            <select className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:border-emerald-500" id="level-filter" onChange={(event) => setLevel(event.target.value)} value={level}>
              <option>All levels</option>
              <option>Bachelor's</option>
              <option>Master's</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredPrograms.map((item) => (
            <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{item.country} · {item.city}</p>
                  <h3 className="mt-2 text-lg font-bold text-gray-950">{item.program}</h3>
                  <p className="mt-1 text-sm text-gray-600">{item.university}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{item.match}% match</span>
                  <button
                    aria-label={`${savedPrograms.has(item.id) ? 'Remove' : 'Add'} ${item.program} ${savedPrograms.has(item.id) ? 'from' : 'to'} shortlist`}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm transition ${savedPrograms.has(item.id) ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-200 text-gray-400 hover:border-emerald-300 hover:text-emerald-700'}`}
                    onClick={() => toggleSaved(item.id)}
                    type="button"
                  >
                    {savedPrograms.has(item.id) ? '♥' : '♡'}
                  </button>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {item.tags.map((tag) => <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600" key={tag}>{tag}</span>)}
              </div>
              <div className="mt-5 grid grid-cols-3 border-t border-gray-100 pt-4 text-sm">
                <div><p className="text-xs text-gray-400">Tuition</p><p className="mt-1 font-semibold text-gray-700">{item.tuition}</p></div>
                <div><p className="text-xs text-gray-400">Duration</p><p className="mt-1 font-semibold text-gray-700">{item.duration}</p></div>
                <div><p className="text-xs text-gray-400">Level</p><p className="mt-1 font-semibold text-gray-700">{item.level}</p></div>
              </div>
            </article>
          ))}
        </div>
        {filteredPrograms.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="font-semibold text-gray-900">No programs found</p>
            <p className="mt-1 text-sm text-gray-500">Try a different program, university, or destination.</p>
            <button className="mt-4 text-sm font-semibold text-emerald-700" onClick={() => { setQuery(''); setCountry('All countries'); setLevel('All levels') }} type="button">Clear all filters</button>
          </div>
        )}
      </section>

      <aside className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
        <div>
          <p className="font-bold text-emerald-950">Your discovery shortlist</p>
          <p className="mt-1 text-sm text-emerald-800">{savedPrograms.size === 0 ? 'Save programs to compare your best options.' : `${savedPrograms.size} program${savedPrograms.size === 1 ? '' : 's'} saved for comparison.`}</p>
        </div>
        <button className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={savedPrograms.size === 0} type="button">Compare saved programs</button>
      </aside>
    </div>
  )
}
