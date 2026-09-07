import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest } from '../auth.js'
import { BTN_PRIMARY, CARD } from '../components/ui/styles.js'

const formatSize = (bytes) => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`

export default function Documents({ session }) {
  const [documents, setDocuments] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const load = useCallback(async () => {
    try { setDocuments(await apiRequest('/documents', { token: session.token })); setError('') }
    catch (requestError) { setError(requestError.message) }
  }, [session.token])
  useEffect(() => { load() }, [load])

  const upload = async (event) => {
    event.preventDefault()
    const file = inputRef.current?.files?.[0]
    if (!file) return
    const data = new FormData(); data.append('file', file)
    setBusy(true); setError('')
    try { await apiRequest('/documents', { token: session.token, method: 'POST', body: data }); event.currentTarget.reset(); await load() }
    catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const download = async (document) => {
    setError('')
    try {
      const response = await fetch(`/api/documents/${document.id}/download`, { headers: { Authorization: `Bearer ${session.token}` } })
      if (!response.ok) throw new Error('The document could not be downloaded.')
      const url = URL.createObjectURL(await response.blob())
      const link = window.document.createElement('a'); link.href = url; link.download = document.fileName; link.click()
      URL.revokeObjectURL(url)
    } catch (requestError) { setError(requestError.message) }
  }

  const remove = async (id) => {
    setBusy(true); setError('')
    try { await apiRequest(`/documents/${id}`, { token: session.token, method: 'DELETE' }); await load() }
    catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  return <div className="mx-auto max-w-5xl space-y-6">
    <header><p className="text-sm font-semibold text-primary-600">File vault</p><h1 className="mt-1 text-3xl font-bold text-secondary-950">Documents</h1><p className="mt-2 text-secondary-500">Upload PDFs, Word documents, or images up to 10 MB.</p></header>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</div>}
    <form className={`${CARD} flex flex-col gap-3 p-5 sm:flex-row sm:items-center`} onSubmit={upload}><label className="flex-1 text-sm font-semibold text-secondary-700" htmlFor="document-file">Choose document<input accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="mt-2 block w-full text-sm text-secondary-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:font-semibold file:text-primary-700" id="document-file" ref={inputRef} required type="file" /></label><button className={BTN_PRIMARY} disabled={busy} type="submit">{busy ? 'Uploading…' : 'Upload'}</button></form>
    <section className="grid gap-3">{documents.length === 0 && <div className={`${CARD} p-8 text-center text-secondary-500`}>No documents uploaded yet.</div>}{documents.map((document) => <article className={`${CARD} flex flex-col gap-3 p-5 sm:flex-row sm:items-center`} key={document.id}><div className="min-w-0 flex-1"><h2 className="truncate font-semibold text-secondary-950">{document.fileName}</h2><p className="text-xs text-secondary-400">{formatSize(document.sizeBytes)} · {new Date(document.uploadedAt).toLocaleDateString()}</p></div><button className="rounded-lg px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50" onClick={() => download(document)} type="button">Download</button><button className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50" disabled={busy} onClick={() => remove(document.id)} type="button">Delete</button></article>)}</section>
  </div>
}
