/**
 * Form primitives shared by the Login and Register pages.
 * Moved verbatim out of pages/Login.jsx — markup, classes and props are unchanged.
 */

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
