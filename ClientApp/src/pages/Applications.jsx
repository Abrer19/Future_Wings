import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'
import { BTN_PRIMARY, CARD, CONTROL } from '../components/ui/styles.js'

const statuses = ['Draft', 'Submitted', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn']

export default function Applications({ session }) {
  const [applications, setApplications] = useState([])
  const [programs, setPrograms] = useState([])
  const [programId, setProgramId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [tracked, discovery] = await Promise.all([
        apiRequest('/applications', { token: session.token }),
        apiRequest('/discovery', { token: session.token }),
      ])
      setApplications(tracked)
      setPrograms(discovery.programs ?? [])
    } catch (requestError) { setError(requestError.message) }
  }, [session.token])

  useEffect(() => { load() }, [load])

  const create = async (event) => {
    event.preventDefault()
    if (!programId) return
    setBusy(true); setError('')
    try {
      await apiRequest('/applications', { token: session.token, method: 'POST', body: JSON.stringify({ programId: Number(programId) }) })
      setProgramId(''); await load()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const updateStatus = async (id, status) => {
    setBusy(true); setError('')
    try {
      await apiRequest(`/applications/${id}/status`, { token: session.token, method: 'PATCH', body: JSON.stringify({ status }) })
      await load()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const remove = async (id) => {
    setBusy(true); setError('')
    try {
      await apiRequest(`/applications/${id}`, { token: session.token, method: 'DELETE' })
      await load()
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const available = programs.filter((program) => !applications.some((item) => item.programId === program.id))
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header><p className="text-sm font-semibold text-primary-600">Your journey</p><h1 className="mt-1 text-3xl font-bold text-secondary-950">Application tracker</h1><p className="mt-2 text-secondary-500">Add programs and keep each application stage current.</p></header>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div>}
      <form className={`${CARD} flex flex-col gap-3 p-5 sm:flex-row`} onSubmit={create}>
        <label className="sr-only" htmlFor="application-program">Program</label>
        <select className={`${CONTROL} flex-1`} id="application-program" onChange={(event) => setProgramId(event.target.value)} value={programId}><option value="">Choose a program to track</option>{available.map((program) => <option key={program.id} value={program.id}>{program.name} — {program.universityName}</option>)}</select>
        <button className={BTN_PRIMARY} disabled={busy || !programId} type="submit">Add application</button>
      </form>
      <section className="grid gap-4">
        {applications.length === 0 && <div className={`${CARD} p-8 text-center text-secondary-500`}>No applications yet. Choose a program above to begin.</div>}
        {applications.map((item) => <article className={`${CARD} flex flex-col gap-4 p-5 sm:flex-row sm:items-center`} key={item.applicationId}><div className="min-w-0 flex-1"><h2 className="font-bold text-secondary-950">{item.programName}</h2><p className="text-sm text-secondary-500">{item.universityName}</p><p className="mt-2 text-xs text-secondary-400">Started {new Date(item.createdAt).toLocaleDateString()}</p></div><select aria-label={`Status for ${item.programName}`} className={CONTROL} disabled={busy} onChange={(event) => updateStatus(item.applicationId, event.target.value)} value={item.status}>{statuses.map((status) => <option key={status}>{status}</option>)}</select><button className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50" disabled={busy} onClick={() => remove(item.applicationId)} type="button">Remove</button></article>)}
      </section>
    </div>
  )
}
