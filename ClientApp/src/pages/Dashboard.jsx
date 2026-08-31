import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../auth.js'

const emptyForm = { title: '', category: 'Application', dueAt: '', notes: '' }

export default function Dashboard({ session }) {
  const [deadlines, setDeadlines] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [filter, setFilter] = useState('Active')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    apiRequest('/deadlines', { token: session.token })
      .then(setDeadlines)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [session.token])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const visibleDeadlines = useMemo(() => deadlines.filter((deadline) => {
    if (filter === 'Completed') return deadline.isCompleted
    if (filter === 'Overdue') return !deadline.isCompleted && new Date(deadline.dueAt).getTime() < now
    return !deadline.isCompleted
  }), [deadlines, filter, now])

  const counts = {
    active: deadlines.filter((deadline) => !deadline.isCompleted).length,
    overdue: deadlines.filter((deadline) => !deadline.isCompleted && new Date(deadline.dueAt).getTime() < now).length,
    completed: deadlines.filter((deadline) => deadline.isCompleted).length,
  }

  const createDeadline = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const created = await apiRequest('/deadlines', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ ...form, dueAt: new Date(form.dueAt).toISOString() }),
      })
      setDeadlines((current) => [...current, created].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)))
      setForm(emptyForm)
      setFilter('Active')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const setCompletion = async (deadline) => {
    setError('')
    try {
      const updated = await apiRequest(`/deadlines/${deadline.id}/completion`, {
        token: session.token,
        method: 'PATCH',
        body: JSON.stringify({ completed: !deadline.isCompleted }),
      })
      setDeadlines((current) => current.map((item) => item.id === updated.id ? updated : item))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const deleteDeadline = async (deadlineId) => {
    setError('')
    try {
      await apiRequest(`/deadlines/${deadlineId}`, { token: session.token, method: 'DELETE' })
      setDeadlines((current) => current.filter((deadline) => deadline.id !== deadlineId))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Dashboard</p>
        <h1 className="mt-1 text-3xl font-bold text-secondary-950">Upcoming deadlines</h1>
        <p className="mt-2 text-secondary-600">Keep applications, scholarships, tests, and visa tasks on schedule.</p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Active" value={counts.active} color="brand" />
        <Stat label="Overdue" value={counts.overdue} color="danger" />
        <Stat label="Completed" value={counts.completed} color="neutral" />
      </section>

      {error && <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-xl border border-secondary-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-secondary-200 px-5 py-4">
            <h2 className="font-semibold text-secondary-950">Your deadlines</h2>
            <div className="flex rounded-lg bg-secondary-100 p-1">
              {['Active', 'Overdue', 'Completed'].map((option) => (
                <button className={`rounded-md px-3 py-1.5 text-xs font-semibold ${filter === option ? 'bg-white text-secondary-950 shadow-sm' : 'text-secondary-600'}`} key={option} onClick={() => setFilter(option)} type="button">{option}</button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-secondary-100">
            {loading && <EmptyState>Loading deadlines…</EmptyState>}
            {!loading && visibleDeadlines.length === 0 && <EmptyState>No {filter.toLowerCase()} deadlines.</EmptyState>}
            {visibleDeadlines.map((deadline) => <DeadlineRow deadline={deadline} key={deadline.id} now={now} onDelete={deleteDeadline} onToggle={setCompletion} />)}
          </div>
        </section>

        <section className="h-fit rounded-xl border border-secondary-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary-950">Add a deadline</h2>
          <form className="mt-5 space-y-4" onSubmit={createDeadline}>
            <Input label="Task" name="title" placeholder="Submit university application" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
            <label className="block text-sm font-medium text-secondary-700" htmlFor="category">Category
              <select className="mt-2 w-full rounded-lg border border-secondary-300 bg-white px-3 py-2.5" id="category" onChange={(event) => setForm({ ...form, category: event.target.value })} value={form.category}>
                {['Application', 'Scholarship', 'Visa', 'Exam', 'Document', 'Other'].map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <Input label="Due date and time" name="dueAt" type="datetime-local" value={form.dueAt} onChange={(value) => setForm({ ...form, dueAt: value })} />
            <label className="block text-sm font-medium text-secondary-700" htmlFor="notes">Notes <span className="font-normal text-secondary-400">(optional)</span>
              <textarea className="mt-2 min-h-20 w-full rounded-lg border border-secondary-300 px-3 py-2.5" id="notes" maxLength={1000} onChange={(event) => setForm({ ...form, notes: event.target.value })} value={form.notes} />
            </label>
            <button className="w-full rounded-lg bg-primary-500 px-4 py-2.5 font-semibold text-white hover:bg-primary-600 disabled:opacity-60" disabled={saving} type="submit">{saving ? 'Adding…' : 'Add deadline'}</button>
          </form>
        </section>
      </div>
    </div>
  )
}

function DeadlineRow({ deadline, now, onDelete, onToggle }) {
  const due = new Date(deadline.dueAt)
  const overdue = !deadline.isCompleted && due.getTime() < now
  return (
    <article className="flex gap-4 px-5 py-4">
      <button aria-label={deadline.isCompleted ? 'Reopen deadline' : 'Complete deadline'} className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${deadline.isCompleted ? 'border-primary-500 bg-primary-500 text-white' : 'border-secondary-300'}`} onClick={() => onToggle(deadline)} type="button">{deadline.isCompleted ? '✓' : ''}</button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`font-semibold ${deadline.isCompleted ? 'text-secondary-400 line-through' : 'text-secondary-950'}`}>{deadline.title}</h3>
          <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-600">{deadline.category}</span>
        </div>
        <p className={`mt-1 text-sm font-medium ${overdue ? 'text-red-600' : 'text-secondary-500'}`}>{overdue ? 'Overdue · ' : ''}{due.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
        {deadline.notes && <p className="mt-2 text-sm text-secondary-600">{deadline.notes}</p>}
      </div>
      <button aria-label="Delete deadline" className="self-start text-sm font-medium text-secondary-400 hover:text-red-600" onClick={() => onDelete(deadline.id)} type="button">Delete</button>
    </article>
  )
}

function Stat({ label, value, color }) {
  const colors = { brand: 'bg-primary-50 text-primary-700', danger: 'bg-red-50 text-red-700', neutral: 'bg-white text-secondary-800' }
  return <div className={`rounded-xl border border-secondary-200 p-5 ${colors[color]}`}><p className="text-sm font-medium">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>
}

function Input({ label, name, value, onChange, ...props }) {
  return <label className="block text-sm font-medium text-secondary-700" htmlFor={name}>{label}<input className="mt-2 w-full rounded-lg border border-secondary-300 px-3 py-2.5" id={name} name={name} onChange={(event) => onChange(event.target.value)} required value={value} {...props} /></label>
}

function EmptyState({ children }) {
  return <p className="px-5 py-12 text-center text-sm text-secondary-500">{children}</p>
}
