import { useState } from 'react'
import { authenticate } from '../auth.js'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import { ErrorMessage, Field, SubmitButton } from '../components/auth/FormControls.jsx'

export default function Register({ onAuthenticated, onNavigate, onBackToHome }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const update = (name) => (value) => setForm((current) => ({ ...current, [name]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const request = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      }
      onAuthenticated(await authenticate('register', request))
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
      subtitle="Start planning your future with FutureWings."
      title="Create your account"
    >
      <form className="space-y-4" onSubmit={submit}>
        {error && <ErrorMessage message={error} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" name="firstName" onChange={update('firstName')} value={form.firstName} />
          <Field label="Last name" name="lastName" onChange={update('lastName')} value={form.lastName} />
        </div>
        <Field label="Email" name="email" onChange={update('email')} type="email" value={form.email} />
        <Field label="Password" minLength={8} name="password" onChange={update('password')} type="password" value={form.password} />
        <Field label="Confirm password" minLength={8} name="confirmPassword" onChange={update('confirmPassword')} type="password" value={form.confirmPassword} />
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-secondary-600">
        Already have an account?{' '}
        <button
          className="font-semibold text-primary-600 hover:text-primary-700"
          onClick={() => onNavigate?.('Login')}
          type="button"
        >
          Sign in
        </button>
      </p>
    </AuthLayout>
  )
}
