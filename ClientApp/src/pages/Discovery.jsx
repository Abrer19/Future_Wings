import { discoveryCountries, discoveryPrograms } from '../data/discoveryPrograms.js'

function ArrowIcon() {
  return <span aria-hidden="true">→</span>
}

export default function Discovery() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-6 py-10 text-white shadow-lg sm:px-10">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-50">Your study journey starts here</span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">Find a program that feels made for you.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-emerald-50 sm:text-lg">Compare universities, understand costs, and discover destinations that match your ambitions.</p>
        </div>
      </section>

      <section aria-labelledby="destinations-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Popular destinations</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-950" id="destinations-title">Explore by country</h2>
          </div>
          <button className="hidden text-sm font-semibold text-emerald-700 hover:text-emerald-900 sm:block" type="button">View all destinations <ArrowIcon /></button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {discoveryCountries.map((country) => (
            <article className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md" key={country.name}>
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-lg font-bold text-emerald-700">{country.name.slice(0, 2).toUpperCase()}</div>
                <ArrowIcon />
              </div>
              <h3 className="mt-5 font-bold text-gray-950">{country.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{country.note}</p>
              <p className="mt-4 text-xs font-semibold text-emerald-700">{country.programs} programs</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="programs-title">
        <div className="mb-4">
          <p className="text-sm font-semibold text-emerald-700">Curated for students</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-950" id="programs-title">Featured programs</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {discoveryPrograms.map((item) => (
            <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{item.country} · {item.city}</p>
                  <h3 className="mt-2 text-lg font-bold text-gray-950">{item.program}</h3>
                  <p className="mt-1 text-sm text-gray-600">{item.university}</p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{item.match}% match</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {item.tags.map((tag) => <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600" key={tag}>{tag}</span>)}
              </div>
              <div className="mt-5 grid grid-cols-3 border-t border-gray-100 pt-4 text-sm">
                <div><p className="text-xs text-gray-400">Tuition</p><p className="mt-1 font-semibold text-gray-700">{item.tuition}</p></div>
                <div><p className="text-xs text-gray-400">Duration</p><p className="mt-1 font-semibold text-gray-700">{item.duration}</p></div>
                <div><p className="text-xs text-gray-400">Level</p><p className="mt-1 font-semibold text-gray-700">{item.level}</p></div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
