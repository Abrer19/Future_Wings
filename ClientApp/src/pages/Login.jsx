import { useState } from 'react'
import { authenticate } from '../auth.js'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import { ErrorMessage, Field, SubmitButton } from '../components/auth/FormControls.jsx'

export default function Login({ onAuthenticated, onNavigate }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)

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

  const handleDemoLogin = async () => {
    setError('')
    setDemoLoading(true)
    try {
      const demoCredentials = { email: 'demo@futurewings.io', password: 'Password123!' }
      setForm(demoCredentials)
      onAuthenticated(await authenticate('login', demoCredentials))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue your study-abroad journey.">
      {/* 1-Click Demo User Button */}
      <div className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/70 p-4 text-left">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-xs text-white">⚡</span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-900">Explore Demo Account</span>
          </div>
          <span className="rounded-full bg-primary-200/80 px-2 py-0.5 text-[10px] font-extrabold text-primary-800">PRO TIER</span>
        </div>
        <p className="mt-1 text-xs text-primary-700">
          Sign in instantly as <strong className="font-semibold text-primary-900">Alex Morgan</strong> with populated applications, document vault, deadlines, and roadmap.
        </p>
        <button
          type="button"
          disabled={loading || demoLoading}
          onClick={handleDemoLogin}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {demoLoading ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Signing in as Demo User...
            </>
          ) : (
            '⚡ 1-Click Sign in as Alex Morgan (Demo)'
          )}
        </button>
      </div>

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

