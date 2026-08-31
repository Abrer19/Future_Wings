import { useState } from 'react'
import { authenticate } from '../auth.js'

export default function Login({ onAuthenticated, onNavigate }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      onAuthenticated(await authenticate('login', form))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue your study-abroad journey.">
      <form className="space-y-5" onSubmit={submit}>
        {error && <ErrorMessage message={error} />}
        <Field label="Email" name="email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Field label="Password" name="password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-secondary-600">New to FutureWings?{' '}<button className="font-semibold text-primary-600 hover:text-primary-700" onClick={onNavigate} type="button">Create an account</button></p>
    </AuthLayout>
  )
}

export function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-secondary-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 font-bold text-white">FW</div>
          <h1 className="text-2xl font-bold text-secondary-950">{title}</h1>
          <p className="mt-2 text-sm text-secondary-600">{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  )
}

export function Field({ label, name, type = 'text', value, onChange, minLength }) {
  return (
    <label className="block text-sm font-medium text-secondary-700" htmlFor={name}>
      {label}
      <input autoComplete={name === 'password' ? 'current-password' : name} className="mt-2 w-full rounded-lg border border-secondary-300 px-3 py-2.5 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100" id={name} minLength={minLength} name={name} onChange={(event) => onChange(event.target.value)} required type={type} value={value} />
    </label>
  )
}

export function ErrorMessage({ message }) {
  return <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{message}</div>
}

export function SubmitButton({ loading, children }) {
  return <button className="w-full rounded-lg bg-primary-500 px-4 py-2.5 font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading} type="submit">{loading ? 'Please wait…' : children}</button>
}
