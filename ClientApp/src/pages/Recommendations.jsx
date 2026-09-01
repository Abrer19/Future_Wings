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
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-col justify-between gap-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700 p-7 text-white shadow-lg sm:flex-row sm:items-end sm:p-10">
        <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Personalized guidance</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Your strongest study matches</h1><p className="mt-3 max-w-2xl leading-7 text-indigo-100">Programs are ranked using academic fit, value, course strengths, and destination opportunities.</p></div>
        <button className="shrink-0 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-800 shadow-sm transition hover:bg-indigo-50" onClick={() => setRefreshKey((key) => key + 1)} type="button">Refresh matches</button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Recommendation summary">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-3xl font-bold text-gray-950">{stats.excellent}</p><p className="mt-1 text-sm text-gray-500">Excellent matches</p></article>
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-3xl font-bold text-gray-950">{stats.countries}</p><p className="mt-1 text-sm text-gray-500">Countries represented</p></article>
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-3xl font-bold text-gray-950">{stats.saved}</p><p className="mt-1 text-sm text-gray-500">Saved to shortlist</p></article>
      </section>

      {error && <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert"><span>{error}</span><button className="font-semibold underline" onClick={() => setRefreshKey((key) => key + 1)} type="button">Try again</button></div>}

      <section aria-labelledby="matches-title">
        <div className="mb-4"><p className="text-sm font-semibold text-indigo-700">Ranked by match</p><h2 className="mt-1 text-2xl font-bold text-gray-950" id="matches-title">Recommended programs</h2></div>
        {loading ? <div className="grid gap-4 lg:grid-cols-2" aria-label="Loading recommendations">{[1, 2, 3, 4].map((item) => <div className="h-64 animate-pulse rounded-2xl bg-gray-200" key={item} />)}</div> : (
          <div className="grid gap-4 lg:grid-cols-2">
            {recommendations.map((item, index) => (
              <article className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" key={item.programId}>
                <div className="absolute right-0 top-0 rounded-bl-2xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">#{index + 1}</div>
                <div className="flex items-center gap-3 pr-12"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 font-bold text-indigo-700">{Math.round(item.matchScore)}%</div><div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">{item.country} · {item.city}</p><h3 className="mt-1 text-lg font-bold text-gray-950">{item.programName}</h3><p className="text-sm text-gray-500">{item.universityName}</p></div></div>
                <p className="mt-5 rounded-2xl bg-indigo-50/70 p-3 text-sm leading-6 text-indigo-950">{item.reason}</p>
                <div className="mt-4 flex flex-wrap gap-2">{item.tags.map((tag) => <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600" key={tag}>{tag}</span>)}</div>
                <dl className="mt-5 grid grid-cols-3 border-t border-gray-100 pt-4 text-sm"><div><dt className="text-xs text-gray-400">Tuition</dt><dd className="mt-1 font-semibold text-gray-700">{formatTuition(item.annualTuitionUsd)}</dd></div><div><dt className="text-xs text-gray-400">Duration</dt><dd className="mt-1 font-semibold text-gray-700">{formatDuration(item.durationMonths)}</dd></div><div><dt className="text-xs text-gray-400">Level</dt><dd className="mt-1 font-semibold text-gray-700">{item.level}</dd></div></dl>
                <button className={`mt-5 w-full rounded-lg border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${item.isSaved ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`} disabled={savingIds.has(item.programId)} onClick={() => toggleSaved(item)} type="button">{savingIds.has(item.programId) ? 'Saving…' : item.isSaved ? 'Saved to shortlist' : 'Save to shortlist'}</button>
              </article>
            ))}
          </div>
        )}
        {!loading && recommendations.length === 0 && <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center"><p className="font-semibold text-gray-900">No recommendations available yet</p><p className="mt-1 text-sm text-gray-500">Discovery catalog data is needed before matches can be generated.</p></div>}
      </section>
    </div>
  )
}
