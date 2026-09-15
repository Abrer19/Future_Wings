import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { BTN_PRIMARY, CARD, FOCUS } from '../components/ui/styles.js'
import { RevenueAreaChart, RevenueDonutChart, SubscribersBarChart } from '../components/admin/RevenueCharts.jsx'

const STATUS_BADGES = {
  Draft: 'bg-secondary-100 text-secondary-700',
  Submitted: 'bg-blue-50 text-blue-700 border border-blue-200',
  'Under Review': 'bg-amber-50 text-amber-700 border border-amber-200',
  Accepted: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold',
  Rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
  Withdrawn: 'bg-secondary-100 text-secondary-500',
}

const TX_STATUS_BADGES = {
  Succeeded: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold',
  Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  Failed: 'bg-rose-50 text-rose-700 border border-rose-200',
  Refunded: 'bg-secondary-100 text-secondary-600',
}

export default function Admin({ session, initialTab = 'Overview' }) {
  const [dashboard, setDashboard] = useState(null)
  const [users, setUsers] = useState([])
  const [applications, setApplications] = useState([])
  const [programs, setPrograms] = useState([])
  const [scholarships, setScholarships] = useState([])
  const [revenue, setRevenue] = useState(null)
  const [tab, setTab] = useState(initialTab)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // User filters
  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [tierFilter, setTierFilter] = useState('All')

  // App filters
  const [appStatusFilter, setAppStatusFilter] = useState('All')
  const [appSearch, setAppSearch] = useState('')

  // Catalog filter
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogLevel, setCatalogLevel] = useState('All')

  // Scholarship filter
  const [scholarshipSearch, setScholarshipSearch] = useState('')

  // Revenue filter
  const [txSearch, setTxSearch] = useState('')

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab)
    }
  }, [initialTab])

  const loadAdminData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [summary, userList, appList, programList, scholarshipList, revenueData] = await Promise.all([
        apiRequest('/admin/dashboard', { token: session.token }),
        apiRequest('/admin/users', { token: session.token }),
        apiRequest('/admin/applications', { token: session.token }),
        apiRequest('/program', { token: session.token }).catch(() => []),
        apiRequest('/scholarship', { token: session.token }).catch(() => []),
        apiRequest('/admin/revenue', { token: session.token }).catch(() => null),
      ])
      setDashboard(summary)
      setUsers(userList)
      setApplications(appList)
      setPrograms(programList || [])
      setScholarships(scholarshipList || [])
      setRevenue(revenueData)
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
      const refreshedRev = await apiRequest('/admin/revenue', { token: session.token }).catch(() => null)
      if (refreshedRev) setRevenue(refreshedRev)
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
    const matchesStatus = appStatusFilter === 'All' || a.status.toLowerCase() === appStatusFilter.toLowerCase()
    const matchesSearch =
      !appSearch ||
      a.studentEmail.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.program.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.university.toLowerCase().includes(appSearch.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const filteredPrograms = programs.filter((p) => {
    const matchesLevel = catalogLevel === 'All' || p.level === catalogLevel
    const matchesSearch =
      !catalogSearch ||
      p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.university.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.country.toLowerCase().includes(catalogSearch.toLowerCase())
    return matchesLevel && matchesSearch
  })

  const filteredScholarships = scholarships.filter((s) => {
    return (
      !scholarshipSearch ||
      s.title?.toLowerCase().includes(scholarshipSearch.toLowerCase()) ||
      s.name?.toLowerCase().includes(scholarshipSearch.toLowerCase()) ||
      s.country?.toLowerCase().includes(scholarshipSearch.toLowerCase()) ||
      s.provider?.toLowerCase().includes(scholarshipSearch.toLowerCase())
    )
  })

  const filteredTransactions = revenue?.recentTransactions?.filter((tx) => {
    return (
      !txSearch ||
      tx.studentEmail?.toLowerCase().includes(txSearch.toLowerCase()) ||
      tx.reference?.toLowerCase().includes(txSearch.toLowerCase()) ||
      tx.tier?.toLowerCase().includes(txSearch.toLowerCase())
    )
  }) || []

  return (
    <div className="mx-auto max-w-7xl">
      {/* Enterprise Admin Header */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-secondary-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-purple-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
              Super Admin Console
            </span>
            <span className="text-xs font-semibold text-secondary-500">Platform Administration & Governance</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-secondary-950 sm:text-3xl">
            Administration Dashboard
          </h1>
          <p className="mt-1 text-sm text-secondary-600">
            Manage platform accounts, subscriptions & revenue (Tk), student admissions, and academic programs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-xl border border-secondary-300 bg-white px-4 py-2 text-xs font-semibold text-secondary-700 shadow-sm transition hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            onClick={loadAdminData}
            type="button"
          >
            Refresh Data
          </button>
        </div>
      </header>

      {error && (
        <div className="mt-6 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
          {error}
        </div>
      )}

      {loading && !dashboard ? (
        <div className="mt-8 rounded-2xl border border-secondary-200 bg-white p-12 text-center text-secondary-500">
          Loading administration console...
        </div>
      ) : (
        dashboard && (
          <>
            {/* KPI Metric Cards in Tk */}
            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric
                label="Total Registered Users"
                value={dashboard.totalUsers}
                detail={`${dashboard.adminUsers} Admins - ${dashboard.agentUsers} Agents`}
              />
              <Metric
                label="Monthly Recurring (MRR)"
                value={`৳${revenue?.monthlyRecurringRevenueTk ? revenue.monthlyRecurringRevenueTk.toLocaleString() : '0'} Tk`}
                detail={`ARR: ৳${revenue?.annualRunRateTk ? revenue.annualRunRateTk.toLocaleString() : '0'} Tk/yr`}
              />
              <Metric
                label="Institutions & Programs"
                value={dashboard.totalUniversities}
                detail={`${dashboard.totalPrograms} Programs in ${dashboard.totalCountries} Countries`}
              />
              <Metric
                label="Upcoming Deadlines"
                value={dashboard.activeDeadlines}
                detail={`${dashboard.overdueDeadlines} currently overdue`}
                alert={dashboard.overdueDeadlines > 0}
              />
            </section>

            {/* Enterprise Tabs */}
            <div className="mt-8 flex flex-wrap gap-2 border-b border-secondary-200">
              {[
                { id: 'Overview', label: 'Platform Overview' },
                { id: 'Revenue & Finance', label: 'Revenue & Charts (Tk)' },
                { id: 'User Management', label: 'User Directory & Roles' },
                { id: 'Applications Oversight', label: 'Applications Queue' },
                { id: 'Academic Catalog', label: 'University Programs' },
                { id: 'Scholarships Manager', label: 'Scholarships & Grants' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  type="button"
                  className={`border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
                    tab === t.id
                      ? 'border-primary-600 text-primary-700'
                      : 'border-transparent text-secondary-500 hover:text-secondary-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* TAB: Overview */}
            {tab === 'Overview' && (
              <div className="mt-6 space-y-6">
                <div className="grid gap-6 xl:grid-cols-2">
                  <Panel title="Recent Student Applications">
                    {dashboard.recentApplications.length === 0 ? (
                      <Empty>No applications submitted yet.</Empty>
                    ) : (
                      dashboard.recentApplications.map((application) => (
                        <div
                          className="flex items-start justify-between gap-4 border-b border-secondary-100 px-5 py-4 last:border-0 hover:bg-secondary-50/50 transition"
                          key={application.id}
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-secondary-900">{application.program}</p>
                            <p className="mt-0.5 truncate text-xs text-secondary-500">
                              {application.university} - <span className="font-mono text-secondary-600">{application.studentEmail}</span>
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

                  <Panel title="System Deadlines & Milestone Workloads">
                    {dashboard.upcomingDeadlines.length === 0 ? (
                      <Empty>No active deadlines logged.</Empty>
                    ) : (
                      dashboard.upcomingDeadlines.map((deadline) => (
                        <div
                          className="flex items-start justify-between gap-4 border-b border-secondary-100 px-5 py-4 last:border-0 hover:bg-secondary-50/50 transition"
                          key={deadline.id}
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-secondary-900">{deadline.title}</p>
                            <p className="mt-0.5 truncate text-xs text-secondary-500">
                              {deadline.studentEmail} - <span className="font-medium text-secondary-600">{deadline.category}</span>
                            </p>
                          </div>
                          <p className={`shrink-0 text-xs font-bold ${deadline.isOverdue ? 'text-rose-600' : 'text-secondary-600'}`}>
                            {deadline.isOverdue ? 'Overdue - ' : ''}
                            {formatDate(deadline.dueAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </Panel>
                </div>

                {/* System Diagnostics & Platform Metrics */}
                <div className="rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-secondary-900">Platform Health & Services</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-secondary-100 bg-secondary-50/50 p-4">
                      <p className="text-xs font-medium text-secondary-500">Database Cluster</p>
                      <p className="mt-1 text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Operational (SQL Server)
                      </p>
                      <p className="mt-1 text-xs text-secondary-400">{dashboard.totalUniversities} institutions, {dashboard.totalUsers} users</p>
                    </div>
                    <div className="rounded-xl border border-secondary-100 bg-secondary-50/50 p-4">
                      <p className="text-xs font-medium text-secondary-500">Authentication & JWT</p>
                      <p className="mt-1 text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" /> Active (HS256 256-bit)
                      </p>
                      <p className="mt-1 text-xs text-secondary-400">Role claims: Admin, Agent, Student</p>
                    </div>
                    <div className="rounded-xl border border-secondary-100 bg-secondary-50/50 p-4">
                      <p className="text-xs font-medium text-secondary-500">Stripe Billing Gateway</p>
                      <p className="mt-1 text-sm font-bold text-primary-600 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-primary-500 inline-block" /> Demo Key Configured (Tk / BDT)
                      </p>
                      <p className="mt-1 text-xs text-secondary-400">Free, Pro (2,280 Tk/mo), Premium (5,880 Tk/mo)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Revenue & Finance in Bangladeshi Taka (Tk / ৳) */}
            {tab === 'Revenue & Finance' && revenue && (
              <section className="mt-6 space-y-6">
                {/* Financial KPIs in Tk */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">Monthly Recurring (MRR)</p>
                    <p className="mt-2 text-3xl font-extrabold text-emerald-600">
                      ৳{revenue.monthlyRecurringRevenueTk?.toLocaleString()} <span className="text-xs font-normal text-secondary-500">Tk / month</span>
                    </p>
                    <p className="mt-1 text-xs text-secondary-400">Recurring SaaS subscriptions in Taka</p>
                  </div>
                  <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">Annual Run Rate (ARR)</p>
                    <p className="mt-2 text-3xl font-extrabold text-secondary-950">
                      ৳{revenue.annualRunRateTk?.toLocaleString()} <span className="text-xs font-normal text-secondary-500">Tk / year</span>
                    </p>
                    <p className="mt-1 text-xs text-secondary-400">Annualized active subscriptions</p>
                  </div>
                  <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">Paid Subscribers</p>
                    <p className="mt-2 text-3xl font-extrabold text-primary-600">
                      {revenue.activePaidSubscribers} <span className="text-xs font-normal text-secondary-500">/ {revenue.totalUsers} users</span>
                    </p>
                    <p className="mt-1 text-xs text-secondary-400">
                      {revenue.totalUsers > 0 ? ((revenue.activePaidSubscribers / revenue.totalUsers) * 100).toFixed(1) : 0}% conversion rate
                    </p>
                  </div>
                  <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-secondary-500">ARPU (Per User in Tk)</p>
                    <p className="mt-2 text-3xl font-extrabold text-secondary-950">
                      ৳{revenue.averageRevenuePerUserTk?.toFixed(2)} <span className="text-xs font-normal text-secondary-500">Tk</span>
                    </p>
                    <p className="mt-1 text-xs text-secondary-400">Average blended revenue per student</p>
                  </div>
                </div>

                {/* GRAPH & CHART ROW 1: Area Trend Curve in Tk + Donut Breakdown in Tk */}
                <div className="grid gap-6 xl:grid-cols-3">
                  <div className="xl:col-span-2">
                    <RevenueAreaChart data={revenue.monthlyBreakdown} />
                  </div>
                  <div>
                    <RevenueDonutChart
                      proCount={revenue.proTierCount}
                      premiumCount={revenue.premiumTierCount}
                      freeCount={revenue.freeTierCount}
                    />
                  </div>
                </div>

                {/* GRAPH & CHART ROW 2: Bar Chart + Plan Cards in Tk */}
                <div className="grid gap-6 xl:grid-cols-3">
                  <div>
                    <SubscribersBarChart data={revenue.monthlyBreakdown} />
                  </div>
                  <div className="xl:col-span-2 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-lg bg-secondary-100 px-2 py-0.5 text-xs font-bold uppercase text-secondary-700">Free Tier</span>
                          <span className="text-base font-extrabold text-secondary-900">0 Tk</span>
                        </div>
                        <p className="mt-3 text-2xl font-black text-secondary-900">{revenue.freeTierCount} <span className="text-xs font-normal text-secondary-500">users</span></p>
                        <p className="mt-1 text-xs text-secondary-500">Discovery search & community</p>
                      </div>
                      <div className="mt-4 h-2 w-full rounded-full bg-secondary-100 overflow-hidden">
                        <div
                          className="h-full bg-secondary-400 rounded-full"
                          style={{ width: `${revenue.totalUsers > 0 ? (revenue.freeTierCount / revenue.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-primary-200 bg-primary-50/30 p-5 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-lg bg-primary-100 px-2 py-0.5 text-xs font-bold uppercase text-primary-700">Pro Tier</span>
                          <span className="text-base font-extrabold text-primary-700">2,280 Tk/mo</span>
                        </div>
                        <p className="mt-3 text-2xl font-black text-primary-900">{revenue.proTierCount} <span className="text-xs font-normal text-secondary-500">subscribers</span></p>
                        <p className="mt-1 text-xs text-secondary-600">
                          Yielding <span className="font-bold text-primary-700">৳{(revenue.proTierCount * 2280).toLocaleString()} Tk</span> monthly
                        </p>
                      </div>
                      <div className="mt-4 h-2 w-full rounded-full bg-primary-100 overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full"
                          style={{ width: `${revenue.totalUsers > 0 ? (revenue.proTierCount / revenue.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-purple-200 bg-purple-50/30 p-5 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-lg bg-purple-100 px-2 py-0.5 text-xs font-bold uppercase text-purple-700">Premium Tier</span>
                          <span className="text-base font-extrabold text-purple-700">5,880 Tk/mo</span>
                        </div>
                        <p className="mt-3 text-2xl font-black text-purple-950">{revenue.premiumTierCount} <span className="text-xs font-normal text-secondary-500">subscribers</span></p>
                        <p className="mt-1 text-xs text-secondary-600">
                          Yielding <span className="font-bold text-purple-700">৳{(revenue.premiumTierCount * 5880).toLocaleString()} Tk</span> monthly
                        </p>
                      </div>
                      <div className="mt-4 h-2 w-full rounded-full bg-purple-100 overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full"
                          style={{ width: `${revenue.totalUsers > 0 ? (revenue.premiumTierCount / revenue.totalUsers) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions Ledger in Tk */}
                <div className="rounded-2xl border border-secondary-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-secondary-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-secondary-900 uppercase tracking-wider">
                        Recent Payment Transactions Ledger (Tk / ৳)
                      </h3>
                      <p className="mt-0.5 text-xs text-secondary-500">Live feed from Stripe Checkout and Subscription Renewals in Bangladeshi Taka</p>
                    </div>
                    <input
                      type="text"
                      value={txSearch}
                      onChange={(e) => setTxSearch(e.target.value)}
                      placeholder="Search student or transaction reference..."
                      className="w-72 rounded-xl border border-secondary-300 bg-white px-3.5 py-2 text-xs text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-secondary-50 text-[11px] font-bold uppercase tracking-wider text-secondary-500">
                        <tr>
                          <th className="px-6 py-3.5">Reference / Txn ID</th>
                          <th className="px-6 py-3.5">Customer Email</th>
                          <th className="px-6 py-3.5">Plan / Product</th>
                          <th className="px-6 py-3.5">Amount Paid (Tk)</th>
                          <th className="px-6 py-3.5">Status</th>
                          <th className="px-6 py-3.5 text-right">Processed Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-100">
                        {filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-secondary-500">
                              No transactions match the search criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredTransactions.map((tx) => {
                            const tkAmount = tx.amountTk || (tx.amount * 120)
                            return (
                              <tr key={tx.id} className="hover:bg-secondary-50/50 transition">
                                <td className="px-6 py-4 font-mono text-xs font-semibold text-secondary-700">{tx.reference}</td>
                                <td className="px-6 py-4 font-mono text-xs text-secondary-900">{tx.studentEmail}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                                    tx.tier === 'Premium' ? 'bg-purple-100 text-purple-700' : 'bg-primary-100 text-primary-700'
                                  }`}>
                                    {tx.tier} Subscription
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs font-bold text-secondary-950">
                                  ৳{tkAmount.toLocaleString()} Tk
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${TX_STATUS_BADGES[tx.status] || 'bg-secondary-100 text-secondary-700'}`}>
                                    {tx.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-secondary-400 text-right">{formatDate(tx.createdAt)}</td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* TAB: User Management */}
            {tab === 'User Management' && (
              <section className="mt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-secondary-600">Filter Role:</span>
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
                    placeholder="Search user by email or name..."
                    className="w-72 rounded-xl border border-secondary-300 bg-white px-3.5 py-2 text-xs text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-secondary-50 text-[11px] font-bold uppercase tracking-wider text-secondary-500">
                        <tr>
                          <th className="px-5 py-3.5">Account & Name</th>
                          <th className="px-5 py-3.5">Profile Background</th>
                          <th className="px-5 py-3.5">System Role</th>
                          <th className="px-5 py-3.5">Subscription Tier</th>
                          <th className="px-5 py-3.5">Activity Counts</th>
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
                                GPA: {user.cgpa ? Number(user.cgpa).toFixed(2) : 'N/A'}
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
                                <option value="Free">Free Tier (0 Tk)</option>
                                <option value="Pro">Pro Tier (2,280 Tk/mo)</option>
                                <option value="Premium">Premium Tier (5,880 Tk/mo)</option>
                              </select>
                            </td>
                            <td className="px-5 py-4 text-xs text-secondary-500">
                              <span className="font-semibold text-secondary-800">{user.applicationCount}</span> apps -{' '}
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
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-secondary-600">Status:</span>
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

                  <input
                    type="text"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    placeholder="Search by student, program or university..."
                    className="w-72 rounded-xl border border-secondary-300 bg-white px-3.5 py-2 text-xs text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-secondary-50 text-[11px] font-bold uppercase tracking-wider text-secondary-500">
                        <tr>
                          <th className="px-5 py-3.5">Applicant Email</th>
                          <th className="px-5 py-3.5">Target Program</th>
                          <th className="px-5 py-3.5">Institution</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5">Submission Date</th>
                          <th className="px-5 py-3.5 text-right">Change Status</th>
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

            {/* TAB: Academic Catalog */}
            {tab === 'Academic Catalog' && (
              <section className="mt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-secondary-600">Level:</span>
                    {['All', "Master's", "Bachelor's", 'PhD'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setCatalogLevel(lvl)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                          catalogLevel === lvl
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-white border border-secondary-200 text-secondary-600 hover:bg-secondary-50'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search program, university or country..."
                    className="w-72 rounded-xl border border-secondary-300 bg-white px-3.5 py-2 text-xs text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-secondary-50 text-[11px] font-bold uppercase tracking-wider text-secondary-500">
                        <tr>
                          <th className="px-5 py-3.5">Program Name</th>
                          <th className="px-5 py-3.5">Institution</th>
                          <th className="px-5 py-3.5">Country</th>
                          <th className="px-5 py-3.5">Degree Level</th>
                          <th className="px-5 py-3.5">Annual Tuition</th>
                          <th className="px-5 py-3.5">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-secondary-100">
                        {filteredPrograms.map((p) => (
                          <tr key={p.id} className="hover:bg-secondary-50/50 transition">
                            <td className="px-5 py-4 font-semibold text-secondary-900">{p.name}</td>
                            <td className="px-5 py-4 text-xs text-secondary-700">{p.university}</td>
                            <td className="px-5 py-4 text-xs font-medium text-secondary-600">{p.country}</td>
                            <td className="px-5 py-4">
                              <span className="inline-flex rounded-md bg-secondary-100 px-2 py-0.5 text-xs font-semibold text-secondary-700">
                                {p.level}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-mono text-xs font-bold text-secondary-900">
                              ${p.annualTuitionUsd?.toLocaleString()} USD (৳{(p.annualTuitionUsd * 120)?.toLocaleString()} Tk)
                            </td>
                            <td className="px-5 py-4 text-xs text-secondary-500">{p.durationMonths} months</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* TAB: Scholarships Manager */}
            {tab === 'Scholarships Manager' && (
              <section className="mt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-secondary-900 uppercase tracking-wider">
                    Global Scholarships Directory ({filteredScholarships.length} Available)
                  </h3>
                  <input
                    type="text"
                    value={scholarshipSearch}
                    onChange={(e) => setScholarshipSearch(e.target.value)}
                    placeholder="Search scholarship name, country..."
                    className="w-72 rounded-xl border border-secondary-300 bg-white px-3.5 py-2 text-xs text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredScholarships.map((s, idx) => (
                    <div key={s.id || idx} className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm hover:border-secondary-300 transition">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-secondary-950 text-sm">{s.name || s.title}</h4>
                        <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-secondary-500">Country: {s.country || 'International / Global'}</p>
                      {s.amount && <p className="mt-2 text-sm font-extrabold text-primary-600">{s.amount}</p>}
                      {s.description && <p className="mt-2 text-xs text-secondary-600 line-clamp-2">{s.description}</p>}
                    </div>
                  ))}
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
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}
