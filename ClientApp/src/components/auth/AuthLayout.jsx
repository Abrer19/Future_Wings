/**
 * Centred card shell shared by the Login and Register pages.
 *
 * Previously exported from pages/Login.jsx, which meant pages/Register.jsx imported
 * its building blocks from a sibling page. Markup and props are unchanged.
 */
export default function AuthLayout({ title, subtitle, children }) {
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
