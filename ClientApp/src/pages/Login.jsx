import { useState } from 'react'
import { authenticate } from '../auth.js'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import { ErrorMessage, Field, SubmitButton } from '../components/auth/FormControls.jsx'

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
