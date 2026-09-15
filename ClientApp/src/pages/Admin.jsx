import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { BTN_PRIMARY, CARD, FOCUS } from '../components/ui/styles.js'

const STATUS_BADGES = {
  Draft: 'bg-secondary-100 text-secondary-700',
  Submitted: 'bg-blue-50 text-blue-700 border border-blue-200',
  'Under Review': 'bg-amber-50 text-amber-700 border border-amber-200',
  Accepted: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold',
  Rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
  Withdrawn: 'bg-secondary-100 text-secondary-500',
}

export default function Admin({ session }) {
  const [dashboard, setDashboard] = useState(null)
  const [users, setUsers] = useState([])
  const [applications, setApplications] = useState([])
  const [tab, setTab] = useState('Overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // User filters
  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [tierFilter, setTierFilter] = useState('All')

  // App filters
  const [appStatusFilter, setAppStatusFilter] = useState('All')

  const loadAdminData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [summary, userList, appList] = await Promise.all([
        apiRequest('/admin/dashboard', { token: session.token }),
        apiRequest('/admin/users', { token: session.token }),
        apiRequest('/admin/applications', { token: session.token }),
      ])
      setDashboard(summary)
      setUsers(userList)
      setApplications(appList)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [session.token])

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  const changeRole = async (user, role) => {
    setError('')
    try {
      const updated = await apiRequest(`/admin/users/${user.id}/role`, {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setToast(`Updated role for ${user.email} to ${role}.`)
      // Refresh dashboard counts
      const refreshedSummary = await apiRequest('/admin/dashboard', { token: session.token })
      setDashboard(refreshedSummary)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const changeTier = async (user, tier) => {
    setError('')
    try {
      const updated = await apiRequest(`/admin/users/${user.id}/tier`, {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify({ tier }),
      })
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setToast(`Updated subscription tier for ${user.email} to ${tier}.`)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const changeAppStatus = async (appId, status) => {
    try {
      await apiRequest(`/admin/applications/${appId}/status`, {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status } : app))
      )
      setToast(`Application status updated to ${status}.`)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'All' || u.role === roleFilter
    const matchesTier = tierFilter === 'All' || u.subscriptionTier === tierFilter
    const matchesSearch =
      !userSearch ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase())
    return matchesRole && matchesTier && matchesSearch
  })

  const filteredApps = applications.filter((a) => {
    return appStatusFilter === 'All' || a.status.toLowerCase() === appStatusFilter.toLowerCase()
  })

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-purple-700 border border-purple-200">
              Super Admin
            </span>
            <span className="text-xs text-secondary-400 font-medium">Platform Governance</span>
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-secondary-950">System Administration</h1>
          <p className="mt-1 text-sm text-secondary-600">
            Platform operations, user authorization, catalog oversight, and admissions metrics.
          </p>
        </div>
        <button
          className="rounded-xl border border-secondary-300 bg-white px-4 py-2 text-xs font-semibold text-secondary-700 shadow-sm hover:bg-secondary-50 transition"
          onClick={loadAdminData}
          type="button"
        >
          Refresh Data
        </button>
      </header>

      {error && (
        <div className="mt-6 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
          {error}
        </div>
      )}

      {loading && !dashboard ? (
        <div className="mt-8 rounded-2xl border border-secondary-200 bg-white p-12 text-center text-secondary-500">
          Loading administration console�
        </div>
      ) : (
        dashboard && (
          <>
            {/* Metric KPI Cards */}
            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Registered Users"
                value={dashboard.totalUsers}
                detail={`${dashboard.adminUsers} Admins � ${dashboard.agentUsers} Agents`}
              />
              <Metric
                label="Total Applications"
                value={dashboard.totalApplications}
                detail="Across global catalog"
              />
              <Metric
                label="Catalog Institutions"
                value={dashboard.totalUniversities}
                detail={`${dashboard.totalPrograms} Programs in ${dashboard.totalCountries} Countries`}
              />
              <Metric
                label="Active Deadlines"
                value={dashboard.activeDeadlines}
                detail={`${dashboard.overdueDeadlines} overdue`}
                alert={dashboard.overdueDeadlines > 0}
              />
            </section>

            {/* Tab Navigation */}
            <div className="mt-8 flex gap-2 border-b border-secondary-200">
              {['Overview', 'User Management', 'Applications Oversight'].map((option) => (
                <button
                  key={option}
                  onClick={() => setTab(option)}
                  type="button"
                  className={`border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
                    tab === option
                      ? 'border-primary-600 text-primary-700'
                      : 'border-transparent text-secondary-500 hover:text-secondary-800'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* TAB: Overview */}
            {tab === 'Overview' && (
              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <Panel title="Recent Student Applications">
                  {dashboard.recentApplications.length === 0 ? (
                    <Empty>No applications have been submitted yet.</Empty>
                  ) : (
                    dashboard.recentApplications.map((application) => (
                      <div
                        className="flex items-start justify-between gap-4 border-b border-secondary-100 px-5 py-4 last:border-0 hover:bg-secondary-50/50 transition"
                        key={application.id}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-secondary-900">{application.program}</p>
                          <p className="mt-0.5 truncate text-xs text-secondary-500">
                            {application.university} � <span className="font-mono text-secondary-600">{application.studentEmail}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGES[application.status] || 'bg-secondary-100 text-secondary-700'}`}>
                            {application.status}
                          </span>
                          <p className="mt-1 text-[11px] text-secondary-400">{formatDate(application.submittedAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </Panel>

                <Panel title="Platform Deadline Workload">
                  {dashboard.upcomingDeadlines.length === 0 ? (
                    <Empty>No active deadlines across students.</Empty>
                  ) : (
                    dashboard.upcomingDeadlines.map((deadline) => (
                      <div
                        className="flex items-start justify-between gap-4 border-b border-secondary-100 px-5 py-4 last:border-0 hover:bg-secondary-50/50 transition"
                        key={deadline.id}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-secondary-900">{deadline.title}</p>
                          <p className="mt-0.5 truncate text-xs text-secondary-500">
                            {deadline.studentEmail} � <span className="font-medium text-secondary-600">{deadline.category}</span>
                          </p>
                        </div>
                        <p className={`shrink-0 text-xs font-bold ${deadline.isOverdue ? 'text-rose-600' : 'text-secondary-600'}`}>
                          {deadline.isOverdue ? '?? Overdue � ' : ''}
                          {formatDate(deadline.dueAt)}
                        </p>
                      </div>
                    ))
                  )}
                </Panel>
              </div>
            )}

            {/* TAB: User Management */}
            {tab === 'User Management' && (
              <section className="mt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-secondary-600">Role:</span>
                    {['All', 'Student', 'Agent', 'Admin'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRoleFilter(r)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          roleFilter === r ? 'bg-secondary-900 text-white' : 'bg-white border border-secondary-200 text-secondary-600 hover:bg-secondary-50'
                        }`}
                      >
                        {r}
                      </button>
                    ))}

                    <span className="ml-3 text-xs font-semibold text-secondary-600">Tier:</span>
                    {['All', 'Free', 'Pro', 'Premium'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTierFilter(t)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          tierFilter === t ? 'bg-primary-600 text-white' : 'bg-white border border-secondary-200 text-secondary-600 hover:bg-secondary-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search email or name�"
                    className="w-64 rounded-xl border border-secondary-300 bg-white px-3.5 py-1.5 text-xs text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-secondary-50 text-[11px] font-bold uppercase tracking-wider text-secondary-500">
                        <tr>
                          <th className="px-5 py-3.5">User</th>
                          <th className="px-5 py-3.5">Profile Info</th>
                          <th className="px-5 py-3.5">System Role</th>
                          <th className="px-5 py-3.5">Subscription Tier</th>
                          <th className="px-5 py-3.5">Activity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-100">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-secondary-50/50 transition">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-secondary-900">
                                {user.firstName || user.lastName ? `${user.firstName} ${user.lastName}` : 'Unregistered Profile'}
                              </p>
                              <p className="text-xs font-mono text-secondary-500">{user.email}</p>
                            </td>
                            <td className="px-5 py-4 text-xs text-secondary-600">
                              <p className="font-medium text-secondary-800">{user.major || 'No major set'}</p>
                              <p className="text-[11px] text-secondary-400">
                                GPA: {user.cgpa ? Number(user.cgpa).toFixed(2) : '�'}
                              </p>
                            </td>
                            <td className="px-5 py-4">
                              <select
                                aria-label={`Role for ${user.email}`}
                                className="rounded-lg border border-secondary-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-secondary-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-secondary-100 disabled:opacity-60"
                                disabled={user.id === session.userId}
                                onChange={(event) => changeRole(user, event.target.value)}
                                value={user.role}
                              >
                                <option value="Student">Student</option>
                                <option value="Agent">Agent (Country)</option>
                                <option value="Admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-5 py-4">
                              <select
                                aria-label={`Subscription Tier for ${user.email}`}
                                className="rounded-lg border border-secondary-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-secondary-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                onChange={(event) => changeTier(user, event.target.value)}
                                value={user.subscriptionTier || 'Free'}
                              >
                                <option value="Free">Free Tier</option>
                                <option value="Pro">Pro Tier</option>
                                <option value="Premium">Premium Tier</option>
                              </select>
                            </td>
                            <td className="px-5 py-4 text-xs text-secondary-500">
                              <span className="font-semibold text-secondary-800">{user.applicationCount}</span> apps �{' '}
                              <span className="font-semibold text-secondary-800">{user.deadlineCount}</span> tasks
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* TAB: Applications Oversight */}
            {tab === 'Applications Oversight' && (
              <section className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-secondary-600">Filter Status:</span>
                  {['All', 'Draft', 'Submitted', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setAppStatusFilter(st)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        appStatusFilter === st
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'bg-white border border-secondary-200 text-secondary-600 hover:bg-secondary-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-secondary-50 text-[11px] font-bold uppercase tracking-wider text-secondary-500">
                        <tr>
                          <th className="px-5 py-3.5">Student Email</th>
                          <th className="px-5 py-3.5">Target Program</th>
                          <th className="px-5 py-3.5">University</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5">Submitted</th>
                          <th className="px-5 py-3.5 text-right">Update Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-100">
                        {filteredApps.map((app) => (
                          <tr key={app.id} className="hover:bg-secondary-50/50 transition">
                            <td className="px-5 py-4 font-mono text-xs text-secondary-800">{app.studentEmail}</td>
                            <td className="px-5 py-4 font-semibold text-secondary-900">{app.program}</td>
                            <td className="px-5 py-4 text-xs text-secondary-600">{app.university}</td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGES[app.status] || 'bg-secondary-100 text-secondary-700'}`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-xs text-secondary-400">{formatDate(app.submittedAt)}</td>
                            <td className="px-5 py-4 text-right">
                              <select
                                value={app.status}
                                onChange={(e) => changeAppStatus(app.id, e.target.value)}
                                className="rounded-lg border border-secondary-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-secondary-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </>
        )
      )}

      <Toast message={toast} />
    </div>
  )
}

function Metric({ label, value, detail, alert }) {
  return (
    <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-secondary-950">{value}</p>
      <p className={`mt-1 text-xs font-medium ${alert ? 'text-rose-600 font-bold' : 'text-secondary-400'}`}>{detail}</p>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-sm">
      <h2 className="border-b border-secondary-200 px-5 py-4 text-sm font-bold text-secondary-950 uppercase tracking-wider">{title}</h2>
      {children}
    </section>
  )
}

function Empty({ children }) {
  return <p className="px-5 py-12 text-center text-sm text-secondary-500">{children}</p>
}

function formatDate(value) {
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}
