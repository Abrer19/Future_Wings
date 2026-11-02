import { useState } from 'react'
import { authenticate } from '../auth.js'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import { ErrorMessage, Field, SubmitButton } from '../components/auth/FormControls.jsx'

export default function Login({ onAuthenticated, onNavigate, onBackToHome }) {
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

  const handleBackToHome = onBackToHome ?? (() => onNavigate?.('Home'))

  return (
    <AuthLayout
      onBackToHome={handleBackToHome}
      subtitle="Sign in to continue your study-abroad journey."
      title="Welcome back"
    >
      <form className="space-y-5" onSubmit={submit}>
        {error && <ErrorMessage message={error} />}
        <Field label="Email" name="email" onChange={(email) => setForm({ ...form, email })} type="email" value={form.email} />
        <Field label="Password" name="password" onChange={(password) => setForm({ ...form, password })} type="password" value={form.password} />
        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-secondary-600">
        New to FutureWings?{' '}
        <button
          className="font-semibold text-primary-600 hover:text-primary-700"
          onClick={() => onNavigate?.('Register')}
          type="button"
        >
          Create an account
        </button>
      </p>
    </AuthLayout>
  )
}
