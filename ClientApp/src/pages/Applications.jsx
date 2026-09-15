import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { CARD, CONTROL, FOCUS, BTN_PRIMARY, BTN_QUIET } from '../components/ui/styles.js'
import { CloseIcon } from '../components/dashboard/icons.jsx'

const filters = ['All', 'Active', 'Accepted', 'Rejected/Withdrawn']
const statuses = ['Draft', 'Submitted', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn']

export default function Applications({ session, onNavigate }) {
  const [applications, setApplications] = useState([])
  const [programs, setPrograms] = useState([])
  const [programId, setProgramId] = useState('')
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [tracked, discovery] = await Promise.all([
        apiRequest('/applications', { token: session.token }),
        apiRequest('/discovery', { token: session.token }),
      ])
      setApplications(tracked ?? [])
      setPrograms(discovery?.programs ?? [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [session.token])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const create = async (event) => {
    event.preventDefault()
    if (!programId) return
    setBusy(true)
    setError('')
    try {
      await apiRequest('/applications', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ programId: Number(programId) }),
      })
      setProgramId('')
      setToast('Application added to tracking')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const updateStatus = async (id, status) => {
    setBusy(true)
    setError('')
    try {
      await apiRequest(`/applications/${id}/status`, {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setToast('Status updated')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id) => {
    setBusy(true)
    setError('')
    try {
      await apiRequest(`/applications/${id}`, { token: session.token, method: 'DELETE' })
      setToast('Application removed')
      await load()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const visibleApplications = useMemo(() => applications.filter((app) => {
    if (filter === 'Active') return ['Draft', 'Submitted', 'Under Review'].includes(app.status)
    if (filter === 'Accepted') return app.status === 'Accepted'
    if (filter === 'Rejected/Withdrawn') return ['Rejected', 'Withdrawn'].includes(app.status)
    return true
  }), [applications, filter])

  const counts = {
    total: applications.length,
    accepted: applications.filter((app) => app.status === 'Accepted').length,
    pending: applications.filter((app) => ['Draft', 'Submitted', 'Under Review'].includes(app.status)).length,
  }

  const available = programs.filter((program) => !applications.some((item) => item.programId === program.id))

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'bg-secondary-100 text-secondary-700'
      case 'Submitted': return 'bg-primary-100 text-primary-700'
      case 'Under Review': return 'bg-amber-100 text-amber-700'
      case 'Accepted': return 'bg-success-100 text-success-700'
      case 'Rejected': return 'bg-danger-100 text-danger-700'
      case 'Withdrawn': return 'bg-secondary-200 text-secondary-800'
      default: return 'bg-secondary-100 text-secondary-700'
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">FutureWings</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-secondary-950">Application Tracker</h1>
        <p className="mt-2 text-secondary-500">Track and manage your university applications throughout every stage.</p>
      </header>

      <section aria-label="Applications summary" className="grid gap-4 sm:grid-cols-3">
        <div className={`p-5 ${CARD}`}>
          <p className="text-sm font-medium text-secondary-500">Total Applications</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-secondary-950">{counts.total}</p>
        </div>
        <div className={`p-5 ${CARD}`}>
          <p className="text-sm font-medium text-secondary-500">Accepted</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-secondary-950">{counts.accepted}</p>
        </div>
        <div className={`p-5 ${CARD}`}>
          <p className="text-sm font-medium text-secondary-500">Pending</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-secondary-950">{counts.pending}</p>
        </div>
      </section>

      {error && (
        <div
          className="flex items-start justify-between gap-4 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700"
          role="alert"
        >
          <span>{error}</span>
          <button
            aria-label="Dismiss error"
            className={`shrink-0 rounded-lg p-1 text-danger-600 transition hover:bg-danger-100 ${FOCUS}`}
            onClick={() => setError('')}
            type="button"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {available.length > 0 && (
        <form className={`${CARD} flex flex-col gap-3 p-5 sm:flex-row`} onSubmit={create}>
          <label className="sr-only" htmlFor="application-program">Program</label>
          <select
            className={`${CONTROL} flex-1`}
            id="application-program"
            onChange={(event) => setProgramId(event.target.value)}
            value={programId}
          >
            <option value="">Choose a program from discovery to start tracking...</option>
            {available.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name} — {program.university ?? program.universityName}
              </option>
            ))}
          </select>
          <button className={BTN_PRIMARY} disabled={busy || !programId} type="submit">
            Track Application
          </button>
        </form>
      )}

      <div className={`overflow-hidden ${CARD}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-200/70 px-5 py-4">
          <h2 className="font-bold text-secondary-950">Your applications</h2>
          <div className="flex items-center gap-4">
            <div className="flex rounded-lg bg-secondary-100 p-1" role="group" aria-label="Filter applications">
              {filters.map((option) => (
                <button
                  aria-pressed={filter === option}
                  className={`min-h-9 rounded-lg px-3.5 py-2 text-xs font-semibold transition sm:py-1.5 ${FOCUS} ${
                    filter === option
                      ? 'bg-white text-secondary-950 shadow-[0_1px_2px_rgba(27,36,50,0.10)]'
                      : 'text-secondary-500 hover:text-secondary-800'
                  }`}
                  key={option}
                  onClick={() => setFilter(option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
            {onNavigate && (
              <button
                type="button"
                className={BTN_PRIMARY}
                onClick={() => onNavigate('Discovery')}
              >
                Find more programs
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-secondary-500 animate-pulse">Loading applications...</div>
        ) : visibleApplications.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary-100">
              <svg aria-hidden="true" className="h-6 w-6 text-secondary-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-secondary-950">No applications found</h3>
            <p className="mt-1 text-sm text-secondary-500">
              {filter === 'All' ? "You haven't started tracking any applications yet." : `No applications match the '${filter}' filter.`}
            </p>
            {filter === 'All' && onNavigate && (
              <button
                className={`mt-4 ${BTN_QUIET}`}
                onClick={() => onNavigate('Discovery')}
                type="button"
              >
                Browse programs to track
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-secondary-100">
            {visibleApplications.map((app) => (
              <div key={app.applicationId ?? app.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4">
                <div>
                  <h3 className="font-semibold text-secondary-950">{app.programName}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-secondary-500">
                    <span>{app.universityName}</span>
                    {app.country && (
                      <>
                        <span>&bull;</span>
                        <span>{app.country}</span>
                      </>
                    )}
                    {app.level && (
                      <>
                        <span>&bull;</span>
                        <span>{app.level}</span>
                      </>
                    )}
                  </div>
                  {app.createdAt && (
                    <p className="mt-1 text-xs text-secondary-400">
                      Added: {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(app.status)}`}>
                    {app.status}
                  </span>
                  <select
                    aria-label={`Change status for ${app.programName}`}
                    className={CONTROL}
                    disabled={busy}
                    onChange={(event) => updateStatus(app.applicationId ?? app.id, event.target.value)}
                    value={app.status}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <button
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-danger-600 hover:bg-danger-50 disabled:opacity-50"
                    disabled={busy}
                    onClick={() => remove(app.applicationId ?? app.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Toast message={toast} />
    </div>
  )
}
