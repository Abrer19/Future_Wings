import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { CARD, CONTROL, FOCUS } from '../components/ui/styles.js'
import ScholarshipDetails from '../components/scholarships/ScholarshipDetails.jsx'
import { flag, money, date, getDeadlineStatus } from '../lib/scholarshipUtils.js'

export default function Scholarships({ session }) {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [countryId, setCountryId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(() => new Set())
  const [toast, setToast] = useState('')

  // Details view state
  const [selectedScholarshipId, setSelectedScholarshipId] = useState(null)
  const [selectedScholarship, setSelectedScholarship] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [interestLoading, setInterestLoading] = useState(false)
  const [togglingStepId, setTogglingStepId] = useState(null)

  const load = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams()
    if (query.trim()) params.set('search', query.trim())
    if (countryId) params.set('countryId', countryId)
    try {
      const response = await apiRequest(`/scholarship?${params}`, { token: session.token, signal })
      setItems(response)
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message)
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [countryId, query, session.token])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => load(controller.signal), 250)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [load])

  // Fetch full details when a scholarship is selected
  const handleViewDetails = useCallback(async (id) => {
    setSelectedScholarshipId(id)
    setDetailsLoading(true)
    setDetailsError('')

    // Seed basic info immediately from list if available
    const cached = items.find((item) => item.id === id)
    if (cached) {
      setSelectedScholarship(cached)
    }

    try {
      const details = await apiRequest(`/scholarship/${id}`, { token: session.token })
      setSelectedScholarship(details)
    } catch (requestError) {
      setDetailsError(requestError.message || 'Failed to load scholarship details.')
    } finally {
      setDetailsLoading(false)
    }
  }, [items, session.token])

  const handleBackToList = useCallback(() => {
    setSelectedScholarshipId(null)
    setSelectedScholarship(null)
    setDetailsError('')
  }, [])

  // Keyboard navigation: Escape key closes details view
  useEffect(() => {
    if (!selectedScholarshipId) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleBackToList()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedScholarshipId, handleBackToList])

  const countries = useMemo(() => {
    const unique = new Map(items.map((item) => [item.countryId, item.countryName]))
    return [...unique].sort((a, b) => a[1].localeCompare(b[1]))
  }, [items])

  const maximumAward = Math.max(0, ...items.map((item) => item.awardAmount ?? 0))

  const addDeadline = async (item) => {
    if (!item?.deadline || adding.has(item.id)) return
    setAdding((current) => new Set(current).add(item.id))
    try {
      await apiRequest('/deadlines', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({
          title: item.name,
          category: 'Scholarship',
          notes: `${item.countryName} · ${item.eligibilityCriteria}`,
          dueAt: item.deadline,
        }),
      })
      setToast(`${item.name} added to your deadlines.`)
      window.setTimeout(() => setToast(''), 3500)
    } catch (requestError) {
      setToast(requestError.message || 'Failed to add deadline.')
      window.setTimeout(() => setToast(''), 3500)
    } finally {
      setAdding((current) => {
        const next = new Set(current)
        next.delete(item.id)
        return next
      })
    }
  }

  // Handle "I'm Interested" action
  const handleExpressInterest = async () => {
    if (!selectedScholarship) return
    setInterestLoading(true)
    try {
      const interest = await apiRequest(`/scholarship/${selectedScholarship.id}/interest`, {
        token: session.token,
        method: 'POST',
      })
      setSelectedScholarship((prev) => (prev ? { ...prev, isInterested: true, interest } : prev))
      // Update in items list as well
      setItems((prev) =>
        prev.map((item) => (item.id === selectedScholarship.id ? { ...item, isInterested: true } : item))
      )
      setToast('Application process started! Check out your preparation checklist.')
      window.setTimeout(() => setToast(''), 4000)
    } catch (requestError) {
      setToast(requestError.message || 'Failed to save interest.')
      window.setTimeout(() => setToast(''), 4000)
    } finally {
      setInterestLoading(false)
    }
  }

  // Toggle checklist step completion status
  const handleToggleStep = async (step) => {
    if (!selectedScholarship || togglingStepId === step.id) return
    setTogglingStepId(step.id)
    const nextCompleted = !step.isCompleted

    // Optimistic update
    setSelectedScholarship((prev) => {
      if (!prev?.interest?.steps) return prev
      return {
        ...prev,
        interest: {
          ...prev.interest,
          steps: prev.interest.steps.map((s) =>
            s.id === step.id
              ? {
                  ...s,
                  isCompleted: nextCompleted,
                  completedAt: nextCompleted ? new Date().toISOString() : null,
                }
              : s
          ),
        },
      }
    })

    try {
      const updatedStep = await apiRequest(
        `/scholarship/${selectedScholarship.id}/checklist/${step.id}`,
        {
          token: session.token,
          method: 'PUT',
          body: JSON.stringify({ isCompleted: nextCompleted }),
        }
      )
      // Confirm with response
      setSelectedScholarship((prev) => {
        if (!prev?.interest?.steps) return prev
        return {
          ...prev,
          interest: {
            ...prev.interest,
            steps: prev.interest.steps.map((s) => (s.id === step.id ? updatedStep : s)),
          },
        }
      })
      setToast(nextCompleted ? `Marked "${step.title}" complete` : `Reverted "${step.title}"`)
      window.setTimeout(() => setToast(''), 3000)
    } catch (requestError) {
      // Rollback on failure
      setSelectedScholarship((prev) => {
        if (!prev?.interest?.steps) return prev
        return {
          ...prev,
          interest: {
            ...prev.interest,
            steps: prev.interest.steps.map((s) => (s.id === step.id ? step : s)),
          },
        }
      })
      setToast(requestError.message || 'Failed to update step status.')
      window.setTimeout(() => setToast(''), 4000)
    } finally {
      setTogglingStepId(null)
    }
  }

  // Render details view if a scholarship is currently selected
  if (selectedScholarshipId) {
    return (
      <div className="mx-auto max-w-7xl">
        <ScholarshipDetails
          scholarship={selectedScholarship}
          loading={detailsLoading && !selectedScholarship}
          error={detailsError}
          onBack={handleBackToList}
          onAddDeadline={() => addDeadline(selectedScholarship)}
          addingDeadline={selectedScholarship ? adding.has(selectedScholarship.id) : false}
          onExpressInterest={handleExpressInterest}
          interestLoading={interestLoading}
          onToggleStep={handleToggleStep}
          togglingStepId={togglingStepId}
          onRetry={() => handleViewDetails(selectedScholarshipId)}
        />
        <Toast message={toast} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7" data-testid="scholarships-directory">
      {/* Directory Header Banner */}
      <section className="rounded-2xl border border-secondary-800 bg-secondary-950 px-6 py-8 text-white sm:px-10 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-400">Funding directory</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl text-white">Fund your study-abroad journey.</h1>
        <p className="mt-2 max-w-2xl text-sm text-secondary-300 leading-relaxed">
          Search verified opportunities by destination, compare awards, and keep every application deadline in one place.
        </p>

        {/* Search & Country filter */}
        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px]">
          <div>
            <label className="sr-only" htmlFor="scholarship-search">
              Search scholarships
            </label>
            <input
              className={`${CONTROL} w-full`}
              id="scholarship-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search scholarship or country"
              type="search"
              value={query}
            />
          </div>
          <div>
            <label className="sr-only" htmlFor="scholarship-country">
              Filter by country
            </label>
            <select
              className={`${CONTROL} w-full`}
              id="scholarship-country"
              onChange={(event) => setCountryId(event.target.value)}
              value={countryId}
            >
              <option value="">All countries</option>
              {countries.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Directory Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className={`${CARD} p-5`}>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-400">Total opportunities</p>
          <p className="mt-2 text-3xl font-black text-secondary-950">{loading ? '—' : items.length}</p>
        </div>
        <div className={`${CARD} p-5`}>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary-400">Maximum award</p>
          <p className="mt-2 text-3xl font-black text-primary-600">{loading ? '—' : money(maximumAward)}</p>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div aria-label="Loading scholarships" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div className="h-64 animate-pulse rounded-2xl bg-secondary-200/60" key={item} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <section className={`${CARD} border-dashed px-6 py-14 text-center space-y-2`}>
          <p className="font-bold text-secondary-900 text-lg">No scholarships found</p>
          <p className="text-sm text-secondary-500">Try another scholarship name or destination.</p>
          <button
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-secondary-300 bg-white px-3 py-1.5 text-xs font-bold text-secondary-700 hover:bg-secondary-50 transition"
            onClick={() => {
              setQuery('')
              setCountryId('')
            }}
            type="button"
          >
            Clear filters
          </button>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const deadlineInfo = getDeadlineStatus(item.deadline)
            return (
              <article
                className={`${CARD} flex flex-col justify-between p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md`}
                key={item.id}
                data-testid={`scholarship-card-${item.id}`}
              >
                <div>
                  {/* Card top row: Flag + Award */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-3xl" title={item.countryName} role="img" aria-label={item.countryName}>
                      {flag(item.countryName)}
                    </span>
                    <span className="rounded-full bg-success-50 border border-success-200/80 px-3 py-1 text-xs font-bold text-success-700 shadow-xs">
                      {money(item.awardAmount)}
                    </span>
                  </div>

                  {/* Destination & status */}
                  <div className="mt-3.5 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary-600">{item.countryName}</p>
                    {item.isInterested && (
                      <span className="rounded-full bg-primary-50 border border-primary-200 px-2 py-0.5 text-[11px] font-bold text-primary-700">
                        Interested
                      </span>
                    )}
                  </div>

                  {/* Title & Criteria */}
                  <h2 className="mt-1.5 text-lg font-bold leading-snug text-secondary-950 line-clamp-2">{item.name}</h2>
                  <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-secondary-600">
                    {item.eligibilityCriteria}
                  </p>
                </div>

                {/* Footer with deadline and action buttons */}
                <div className="mt-5 border-t border-secondary-100 pt-4 space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-secondary-400">Deadline</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${deadlineInfo.badgeClass}`}>
                      {date(item.deadline)}
                    </span>
                  </div>

                  {/* Actions: View Details (Primary Orange) and Add to Deadlines (Outline Orange) */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      aria-label={`View details for ${item.name}`}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-500 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-primary-600 active:scale-[0.98] transition ${FOCUS}`}
                      onClick={() => handleViewDetails(item.id)}
                      type="button"
                      data-testid={`view-scholarship-btn-${item.id}`}
                    >
                      View Details
                    </button>
                    <button
                      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary-300 bg-white px-3 py-2.5 text-xs sm:text-sm font-bold text-primary-700 shadow-sm hover:bg-primary-50 active:scale-[0.98] transition disabled:opacity-50 disabled:border-secondary-200 disabled:text-secondary-400 disabled:bg-secondary-50 disabled:cursor-not-allowed ${FOCUS}`}
                      disabled={!item.deadline || adding.has(item.id)}
                      onClick={() => addDeadline(item)}
                      type="button"
                      data-testid={`card-add-deadline-${item.id}`}
                    >
                      {adding.has(item.id) ? 'Adding…' : 'Add to Deadlines'}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}
      <Toast message={toast} />
    </div>
  )
}
