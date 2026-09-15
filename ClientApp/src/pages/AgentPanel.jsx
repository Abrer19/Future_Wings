import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { BTN_PRIMARY, CARD, FOCUS, INPUT } from '../components/ui/styles.js'

const STATUS_BADGES = {
  Draft: 'bg-secondary-100 text-secondary-700',
  Submitted: 'bg-blue-50 text-blue-700 border border-blue-200',
  'Under Review': 'bg-amber-50 text-amber-700 border border-amber-200',
  Accepted: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold',
  Rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
  Withdrawn: 'bg-secondary-100 text-secondary-500',
}

export default function AgentPanel({ session }) {
  const [countries, setCountries] = useState([])
  const [selectedCountryId, setSelectedCountryId] = useState('')
  const [overview, setOverview] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [statusFilter, setStatusFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  // Modals for adding catalog items
  const [showAddProgram, setShowAddProgram] = useState(false)
  const [showAddScholarship, setShowAddScholarship] = useState(false)
  const [newProgram, setNewProgram] = useState({ universityId: '', name: '', level: "Master's", annualTuitionUsd: 25000, durationMonths: 24, tags: '' })
  const [newScholarship, setNewScholarship] = useState({ name: '' })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const countryList = await apiRequest('/agent/countries', { token: session.token })
      setCountries(countryList)

      const activeCountryId = selectedCountryId ? parseInt(selectedCountryId, 10) : (countryList[0]?.id || null)
      if (!selectedCountryId && activeCountryId) {
        setSelectedCountryId(activeCountryId.toString())
      }

      const [overviewData, applicantList] = await Promise.all([
        apiRequest(`/agent/overview${activeCountryId ? `?countryId=${activeCountryId}` : ''}`, { token: session.token }),
        apiRequest(`/agent/applicants${activeCountryId ? `?countryId=${activeCountryId}` : ''}`, { token: session.token }),
      ])

      setOverview(overviewData)
      setApplicants(applicantList)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [session.token, selectedCountryId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCountryChange = (e) => {
    setSelectedCountryId(e.target.value)
  }

  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdatingId(applicationId)
    try {
      await apiRequest(`/agent/applications/${applicationId}/status`, {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      setApplicants((prev) =>
        prev.map((app) => (app.applicationId === applicationId ? { ...app, status: newStatus } : app))
      )
      setToast(`Application status updated to "${newStatus}"!`)
      // Refresh overview stats
      const updatedOverview = await apiRequest(
        `/agent/overview${selectedCountryId ? `?countryId=${selectedCountryId}` : ''}`,
        { token: session.token }
      )
      setOverview(updatedOverview)
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCreateScholarship = async (e) => {
    e.preventDefault()
    if (!newScholarship.name || !selectedCountryId) return
    try {
      await apiRequest('/agent/scholarships', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ countryId: parseInt(selectedCountryId, 10), name: newScholarship.name }),
      })
      setToast('Scholarship created successfully!')
      setShowAddScholarship(false)
      setNewScholarship({ name: '' })
      loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  const filteredApplicants = applicants.filter((app) => {
    const matchesStatus = statusFilter === 'All' || app.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesSearch =
      !searchQuery ||
      app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.universityName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header with Territory Filter */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-teal-500/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-teal-700 border border-teal-200">
              Country Agent Hub
            </span>
            <span className="text-xs text-secondary-400 font-medium">Territory Admissions Oversight</span>
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-secondary-950">Country Admissions Management</h1>
          <p className="mt-1 text-sm text-secondary-600">
            Review student applications, manage academic catalog offerings, and update decisions for your designated territory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-secondary-600 uppercase" htmlFor="territory-select">
              Territory:
            </label>
            <select
              id="territory-select"
              value={selectedCountryId}
              onChange={handleCountryChange}
              className="rounded-xl border border-secondary-300 bg-white px-3 py-2 text-sm font-semibold text-secondary-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.applicationsCount} applicants)
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadData}
            type="button"
            className="rounded-xl border border-secondary-300 bg-white px-3.5 py-2 text-xs font-semibold text-secondary-700 shadow-sm hover:bg-secondary-50 transition"
          >
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="mt-6 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
          {error}
        </div>
      )}

      {loading && !overview ? (
        <div className="mt-8 rounded-2xl border border-secondary-200 bg-white p-12 text-center text-secondary-500">
          Loading country agent workspace�
        </div>
      ) : (
        <>
          {/* Territory Overview Metrics */}
          {overview && (
            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">Total Applicants ({overview.CountryName})</p>
                <p className="mt-2 text-3xl font-extrabold text-secondary-950">{overview.TotalApplicants}</p>
                <p className="mt-1 text-xs text-secondary-400">Targeting institutions in {overview.CountryName}</p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Review</p>
                <p className="mt-2 text-3xl font-extrabold text-amber-900">{overview.PendingReviewCount}</p>
                <p className="mt-1 text-xs text-amber-700 font-medium">Awaiting admissions decision</p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Accepted Offers</p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-900">{overview.AcceptedCount}</p>
                <p className="mt-1 text-xs text-emerald-700 font-medium">Admissions granted</p>
              </div>

              <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">Catalog Resources</p>
                <p className="mt-2 text-3xl font-extrabold text-secondary-950">{overview.UniversitiesCount} <span className="text-sm font-normal text-secondary-400">Universities</span></p>
                <p className="mt-1 text-xs text-secondary-400">{overview.ScholarshipsCount} active scholarships</p>
              </div>
            </section>
          )}

          {/* Action Toolbar & Filters */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-secondary-200 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              {['All', 'Under Review', 'Submitted', 'Accepted', 'Rejected', 'Draft'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    statusFilter === status
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-white text-secondary-600 border border-secondary-200 hover:bg-secondary-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search applicant or program�"
                className="w-64 rounded-xl border border-secondary-300 bg-white px-3.5 py-1.5 text-xs text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowAddScholarship(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
              >
                + Add Scholarship
              </button>
            </div>
          </div>

          {/* Applicants Table */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary-50 text-[11px] font-bold uppercase tracking-wider text-secondary-500">
                  <tr>
                    <th className="px-5 py-3.5">Applicant</th>
                    <th className="px-5 py-3.5">Academic Profile</th>
                    <th className="px-5 py-3.5">Target Program & University</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Submitted</th>
                    <th className="px-5 py-3.5 text-right">Admissions Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {filteredApplicants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-secondary-500">
                        No applicants found matching the selected filters for this territory.
                      </td>
                    </tr>
                  ) : (
                    filteredApplicants.map((app) => (
                      <tr key={app.applicationId} className="hover:bg-secondary-50/60 transition">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-secondary-900">{app.studentName}</p>
                          <p className="text-xs text-secondary-500">{app.studentEmail}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-medium text-secondary-800">
                            GPA: <strong className="font-bold text-primary-600">{app.cgpa ? Number(app.cgpa).toFixed(2) : 'N/A'}</strong>
                          </p>
                          <p className="text-[11px] text-secondary-500">
                            Major: {app.major || 'Undeclared'} {app.budgetUsd ? `� $${Number(app.budgetUsd).toLocaleString()}/yr` : ''}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-secondary-900">{app.programName}</p>
                          <p className="text-xs text-secondary-500">{app.universityName} ({app.countryName})</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGES[app.status] || 'bg-secondary-100 text-secondary-700'}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-secondary-500">
                          {new Date(app.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <select
                            aria-label={`Change status for ${app.studentName}`}
                            value={app.status}
                            disabled={updatingId === app.applicationId}
                            onChange={(e) => handleStatusChange(app.applicationId, e.target.value)}
                            className="rounded-lg border border-secondary-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-secondary-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                          >
                            <option value="Draft">Draft</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Withdrawn">Withdrawn</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Add Scholarship Modal */}
          {showAddScholarship && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-950/50 p-4 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-secondary-200">
                <h3 className="text-lg font-bold text-secondary-950">Add Territory Scholarship</h3>
                <p className="mt-1 text-xs text-secondary-500">
                  Publish a new funding opportunity for students applying to {overview?.CountryName}.
                </p>
                <form onSubmit={handleCreateScholarship} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-secondary-700 mb-1">Scholarship Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ontario Merit Excellence Scholarship"
                      value={newScholarship.name}
                      onChange={(e) => setNewScholarship({ ...newScholarship, name: e.target.value })}
                      className="w-full rounded-xl border border-secondary-300 px-3.5 py-2 text-sm text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddScholarship(false)}
                      className="rounded-xl border border-secondary-300 px-4 py-2 text-xs font-semibold text-secondary-700 hover:bg-secondary-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-700"
                    >
                      Publish Scholarship
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      <Toast message={toast} />
    </div>
  )
}
