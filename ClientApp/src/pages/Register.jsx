import { useState } from 'react'
import { authenticate } from '../auth.js'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import { ErrorMessage, Field, SubmitButton } from '../components/auth/FormControls.jsx'

export default function Register({ onAuthenticated, onNavigate }) {
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

  return (
    <AuthLayout title="Create your account" subtitle="Start planning your future with FutureWings.">
      <form className="space-y-4" onSubmit={submit}>
        {error && <ErrorMessage message={error} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" name="firstName" value={form.firstName} onChange={update('firstName')} />
          <Field label="Last name" name="lastName" value={form.lastName} onChange={update('lastName')} />
        </div>
        <Field label="Email" name="email" type="email" value={form.email} onChange={update('email')} />
        <Field label="Password" minLength={8} name="password" type="password" value={form.password} onChange={update('password')} />
        <Field label="Confirm password" minLength={8} name="confirmPassword" type="password" value={form.confirmPassword} onChange={update('confirmPassword')} />
        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-secondary-600">Already have an account?{' '}<button className="font-semibold text-primary-600 hover:text-primary-700" onClick={onNavigate} type="button">Sign in</button></p>
    </AuthLayout>
  )
}
