export default function StubPage({ title, description, action }) {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="border-b border-secondary-200 pb-5">
        <p className="mb-2 text-xs font-semibold uppercase text-primary-600">FutureWings</p>
        <h1 className="text-3xl font-semibold text-secondary-950">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary-600">{description}</p>
      </div>
      <div className="mt-6 rounded-md border border-secondary-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-secondary-900">{action}</h2>
        <p className="mt-2 text-sm text-secondary-500">This module is ready for API integration.</p>
      </div>
    </section>
  )
}
