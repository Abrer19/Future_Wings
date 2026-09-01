import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'

export default function Admin({ session }) {
  const [dashboard, setDashboard] = useState(null)
  const [users, setUsers] = useState([])
  const [tab, setTab] = useState('Overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAdminData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [summary, userList] = await Promise.all([
        apiRequest('/admin/dashboard', { token: session.token }),
        apiRequest('/admin/users', { token: session.token }),
      ])
      setDashboard(summary)
      setUsers(userList)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [session.token])

  useEffect(() => {
    const request = window.setTimeout(loadAdminData, 0)
    return () => window.clearTimeout(request)
  }, [loadAdminData])

  const changeRole = async (user, role) => {
    setError('')
    try {
      const updated = await apiRequest(`/admin/users/${user.id}/role`, {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item))
      setDashboard((current) => ({
        ...current,
        adminUsers: current.adminUsers + (role === 'Admin' ? 1 : -1),
      }))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Administration</p>
          <h1 className="mt-1 text-3xl font-bold text-secondary-950">Platform operations</h1>
          <p className="mt-2 text-secondary-600">Monitor students, applications, and deadline activity.</p>
        </div>
        <button className="rounded-lg border border-secondary-300 bg-white px-4 py-2 text-sm font-semibold text-secondary-700 hover:bg-secondary-50" onClick={loadAdminData} type="button">Refresh data</button>
      </header>

      {error && <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}
      {loading && <div className="mt-8 rounded-2xl border border-secondary-200 bg-white p-12 text-center text-secondary-500">Loading admin data…</div>}

      {!loading && dashboard && <>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Total users" value={dashboard.totalUsers} detail={`${dashboard.adminUsers} administrators`} />
          <Metric label="Applications" value={dashboard.totalApplications} detail="Across all students" />
          <Metric label="Active deadlines" value={dashboard.activeDeadlines} detail={`${dashboard.overdueDeadlines} overdue`} alert={dashboard.overdueDeadlines > 0} />
          <Metric label="Completed tasks" value={dashboard.completedDeadlines} detail="Deadline completions" />
        </section>

        <div className="mt-8 flex gap-1 border-b border-secondary-200">
          {['Overview', 'Users'].map((option) => <button className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === option ? 'border-primary-500 text-primary-600' : 'border-transparent text-secondary-500 hover:text-secondary-800'}`} key={option} onClick={() => setTab(option)} type="button">{option}</button>)}
        </div>

        {tab === 'Overview' ? <Overview dashboard={dashboard} /> : <UserDirectory currentUserId={session.userId} onRoleChange={changeRole} users={users} />}
      </>}
    </div>
  )
}

function Overview({ dashboard }) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <Panel title="Recent applications">
        {dashboard.recentApplications.length === 0 ? <Empty>No applications have been submitted.</Empty> : dashboard.recentApplications.map((application) => (
          <div className="flex items-start justify-between gap-4 border-b border-secondary-100 px-5 py-4 last:border-0" key={application.id}>
            <div className="min-w-0"><p className="font-semibold text-secondary-900">{application.program}</p><p className="mt-1 truncate text-sm text-secondary-500">{application.university} · {application.studentEmail}</p></div>
            <div className="text-right"><Badge>{application.status}</Badge><p className="mt-2 text-xs text-secondary-400">{formatDate(application.submittedAt)}</p></div>
          </div>
        ))}
      </Panel>
      <Panel title="Deadline workload">
        {dashboard.upcomingDeadlines.length === 0 ? <Empty>No active deadlines.</Empty> : dashboard.upcomingDeadlines.map((deadline) => (
          <div className="flex items-start justify-between gap-4 border-b border-secondary-100 px-5 py-4 last:border-0" key={deadline.id}>
            <div className="min-w-0"><p className="font-semibold text-secondary-900">{deadline.title}</p><p className="mt-1 truncate text-sm text-secondary-500">{deadline.studentEmail} · {deadline.category}</p></div>
            <p className={`shrink-0 text-sm font-semibold ${deadline.isOverdue ? 'text-red-600' : 'text-secondary-600'}`}>{deadline.isOverdue ? 'Overdue · ' : ''}{formatDate(deadline.dueAt)}</p>
          </div>
        ))}
      </Panel>
    </div>
  )
}

function UserDirectory({ users, currentUserId, onRoleChange }) {
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-sm">
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="bg-secondary-50 text-xs uppercase tracking-wide text-secondary-500"><tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Role</th><th className="px-5 py-3">Applications</th><th className="px-5 py-3">Deadlines</th><th className="px-5 py-3">Access</th></tr></thead>
        <tbody className="divide-y divide-secondary-100">{users.map((user) => (
          <tr key={user.id}>
            <td className="px-5 py-4"><p className="font-semibold text-secondary-900">{user.firstName} {user.lastName}</p><p className="text-secondary-500">{user.email}</p></td>
            <td className="px-5 py-4"><Badge>{user.role}</Badge></td>
            <td className="px-5 py-4 text-secondary-600">{user.applicationCount}</td>
            <td className="px-5 py-4 text-secondary-600">{user.deadlineCount}</td>
            <td className="px-5 py-4"><select aria-label={`Role for ${user.email}`} className="rounded-lg border border-secondary-300 bg-white px-3 py-2 disabled:bg-secondary-100" disabled={user.id === currentUserId} onChange={(event) => onRoleChange(user, event.target.value)} value={user.role}><option>Student</option><option>Admin</option></select></td>
          </tr>
        ))}</tbody>
      </table></div>
    </section>
  )
}

function Metric({ label, value, detail, alert }) {
  return <div className="rounded-2xl border border-secondary-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-secondary-500">{label}</p><p className="mt-2 text-3xl font-bold text-secondary-950">{value}</p><p className={`mt-2 text-xs font-medium ${alert ? 'text-red-600' : 'text-secondary-400'}`}>{detail}</p></div>
}

function Panel({ title, children }) {
  return <section className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-sm"><h2 className="border-b border-secondary-200 px-5 py-4 font-semibold text-secondary-950">{title}</h2>{children}</section>
}

function Badge({ children }) {
  return <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-600">{children}</span>
}

function Empty({ children }) {
  return <p className="px-5 py-12 text-center text-sm text-secondary-500">{children}</p>
}

function formatDate(value) {
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}
