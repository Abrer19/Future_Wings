import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../auth.js'

const formatTuition = (amount) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(amount)

const formatDuration = (months) => months % 12 === 0
  ? `${months / 12} year${months === 12 ? '' : 's'}`
  : `${months} months`

export default function Recommendations({ session }) {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingIds, setSavingIds] = useState(() => new Set())
  const [refreshKey, setRefreshKey] = useState(0)

  const loadRecommendations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRecommendations(await apiRequest('/recommendation', { token: session.token }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [session.token])

  useEffect(() => {
    const timer = setTimeout(loadRecommendations, 0)
    return () => clearTimeout(timer)
  }, [loadRecommendations, refreshKey])

  const toggleSaved = async (recommendation) => {
    if (savingIds.has(recommendation.programId)) return
    const nextSaved = !recommendation.isSaved
    setSavingIds((current) => new Set(current).add(recommendation.programId))
    setRecommendations((current) => current.map((item) =>
      item.programId === recommendation.programId ? { ...item, isSaved: nextSaved } : item))
    try {
      await apiRequest(`/discovery/saved/${recommendation.programId}`, { token: session.token, method: nextSaved ? 'PUT' : 'DELETE' })
    } catch (requestError) {
      setRecommendations((current) => current.map((item) =>
        item.programId === recommendation.programId ? { ...item, isSaved: recommendation.isSaved } : item))
      setError(requestError.message)
    } finally {
      setSavingIds((current) => { const next = new Set(current); next.delete(recommendation.programId); return next })
    }
  }

  const stats = useMemo(() => ({
    excellent: recommendations.filter((item) => item.matchScore >= 90).length,
    countries: new Set(recommendations.map((item) => item.country)).size,
    saved: recommendations.filter((item) => item.isSaved).length,
  }), [recommendations])

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      {/* Header Banner */}
      <header className="relative overflow-hidden flex flex-col justify-between gap-6 rounded-3xl border border-secondary-200 bg-gradient-to-r from-secondary-950 via-secondary-900 to-secondary-950 p-6 text-white shadow-xl sm:flex-row sm:items-end sm:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/15 blur-3xl" />
        <div className="max-w-3xl relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-500/20 border border-primary-400/30 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-300">
            <span className="h-2 w-2 rounded-full bg-primary-400 animate-pulse" />
            AI Profile Fit Engine
          </span>
          <h1 className="mt-3 text-2xl sm:text-4xl font-black tracking-tight text-white">
            Your Strongest University Matches
          </h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-secondary-300">
            Ranked using multi-factor profile modeling: academic eligibility, budget coverage, visa historical outcome rates, and post-study opportunities.
          </p>
        </div>
        <button
          className="shrink-0 rounded-2xl bg-white px-5 py-3 text-xs font-extrabold text-secondary-950 shadow-md transition hover:bg-primary-50 hover:text-primary-700 relative z-10"
          onClick={() => setRefreshKey((key) => key + 1)}
          type="button"
        >
          Refresh Matches
        </button>
      </header>

      {/* KPI Stats */}
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Recommendation summary">
        <article className="group rounded-3xl border border-secondary-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">Tier 1 Matches</p>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-primary-600 tabular-nums">{stats.excellent}</p>
          <p className="mt-1 text-xs text-secondary-400 font-medium">90%+ match score</p>
        </article>
        <article className="group rounded-3xl border border-secondary-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">Global Destinations</p>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-secondary-950 tabular-nums">{stats.countries}</p>
          <p className="mt-1 text-xs text-secondary-400 font-medium">Countries represented</p>
        </article>
        <article className="group rounded-3xl border border-secondary-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">Saved to Shortlist</p>
          <p className="mt-2 text-3xl sm:text-4xl font-black text-secondary-950 tabular-nums">{stats.saved}</p>
          <p className="mt-1 text-xs text-secondary-400 font-medium">Ready for application</p>
        </article>
      </section>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-medium text-danger-700 shadow-sm" role="alert">
          <span>{error}</span>
          <button className="font-bold underline" onClick={() => setRefreshKey((key) => key + 1)} type="button">
            Try again
          </button>
        </div>
      )}

      {/* Program Cards Grid */}
      <section aria-labelledby="matches-title">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Ranked by Profile Fit</p>
          <h2 className="mt-0.5 text-2xl font-black text-secondary-950" id="matches-title">
            Recommended Degree Programs
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-2" aria-label="Loading recommendations">
            {[1, 2, 3, 4].map((item) => (
              <div className="h-64 animate-pulse rounded-3xl bg-secondary-200/60" key={item} />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {recommendations.map((item, index) => (
              <article
                className="group relative overflow-hidden rounded-3xl border border-secondary-200/80 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary-300 hover:shadow-xl flex flex-col justify-between"
                key={item.programId}
              >
                <div>
                  <div className="absolute right-0 top-0 rounded-bl-2xl bg-primary-50 border-l border-b border-primary-200 px-3.5 py-1.5 text-xs font-black text-primary-800">
                    Rank #{index + 1}
                  </div>

                  <div className="flex items-center gap-4 pr-16">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 font-black text-lg text-white shadow-md">
                      {Math.round(item.matchScore)}%
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
                        {item.country} · {item.city}
                      </p>
                      <h3 className="mt-0.5 text-lg font-black text-secondary-950 group-hover:text-primary-600 transition">
                        {item.programName}
                      </h3>
                      <p className="text-xs font-semibold text-secondary-500">{item.universityName}</p>
                    </div>
                  </div>

                  <p className="mt-4 rounded-2xl bg-secondary-50 border border-secondary-200/70 p-3.5 text-xs leading-relaxed text-secondary-800">
                    <span className="font-bold text-primary-700 mr-1">Match Reason:</span>
                    {item.reason}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span className="rounded-lg bg-secondary-100/80 px-2.5 py-0.5 text-[11px] font-medium text-secondary-600" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-secondary-100 pt-4">
                  <dl className="grid grid-cols-3 text-xs mb-4">
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-secondary-400">Tuition</dt>
                      <dd className="mt-0.5 font-bold text-secondary-900">{formatTuition(item.annualTuitionUsd)}/yr</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-secondary-400">Duration</dt>
                      <dd className="mt-0.5 font-bold text-secondary-900">{formatDuration(item.durationMonths)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase font-bold text-secondary-400">Degree</dt>
                      <dd className="mt-0.5 font-bold text-secondary-900">{item.level}</dd>
                    </div>
                  </dl>

                  <button
                    className={`w-full rounded-2xl py-2.5 text-xs font-extrabold transition shadow-sm ${
                      item.isSaved
                        ? 'bg-primary-500 text-white shadow-primary-500/25'
                        : 'border border-secondary-300 bg-white text-secondary-700 hover:bg-secondary-50 hover:border-secondary-400'
                    }`}
                    disabled={savingIds.has(item.programId)}
                    onClick={() => toggleSaved(item)}
                    type="button"
                  >
                    {savingIds.has(item.programId) ? 'Saving…' : item.isSaved ? 'Saved to Shortlist' : 'Add to Shortlist'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && recommendations.length === 0 && (
          <div className="rounded-3xl border border-dashed border-secondary-300 bg-white px-6 py-14 text-center">
            <p className="font-bold text-secondary-950 text-base">No recommendations generated yet</p>
            <p className="mt-1 text-xs text-secondary-500">Complete your profile details to generate personalized program matches.</p>
          </div>
        )}
      </section>
    </div>
  )
}
