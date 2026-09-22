import { useEffect, useState } from 'react'
import DestinationArticle from './DestinationArticle.jsx'
import SectionHeading from './SectionHeading.jsx'
import { ArrowRightIcon } from './icons.jsx'
import { destinationArticles } from './destinationArticles.js'

<<<<<<< HEAD
const destinations = [
  {
    name: 'United States',
    tier: 'Tier 1 Global Ivy',
    avgCost: '$25k – $55k/yr',
    workRights: 'OPT 1–3 Years',
    highlight: 'World-renowned research labs, Silicon Valley networks & STEM OPT.',
  },
  {
    name: 'United Kingdom',
    tier: 'Tier 1 Heritage',
    avgCost: '£14k – £32k/yr',
    workRights: '2-Yr Graduate Route',
    highlight: '1-Year accelerated Master’s programs and historic Russell Group universities.',
  },
  {
    name: 'Canada',
    tier: 'Tier 1 Immigration',
    avgCost: 'CAD $18k – $38k/yr',
    workRights: '3-Yr PGWP Available',
    highlight: 'Clear post-graduation work permits, welcoming culture, and top co-op programs.',
  },
  {
    name: 'Germany',
    tier: 'Tier 2 Low Tuition',
    avgCost: '€0 – €3k/yr',
    workRights: '18-Mo Job Seeker',
    highlight: 'Virtually zero tuition fees at world-class public technical universities (TU9).',
  },
  {
    name: 'Australia',
    tier: 'Tier 1 Quality of Life',
    avgCost: 'AUD $28k – $46k/yr',
    workRights: '2–4 Yr Post-Study',
    highlight: 'High minimum wages, Group of Eight prestige, and generous regional visa perks.',
  },
  {
    name: 'Japan',
    tier: 'Tier 2 High Tech',
    avgCost: '$5k – $15k/yr',
    workRights: 'Designated Visa Track',
    highlight: 'Generous MEXT government scholarships, cutting-edge robotics and AI engineering.',
  },
]
=======
const tierStyles = {
  'Tier 1': 'bg-primary-500/10 text-primary-500',
  'Tier 2': 'bg-warning/15 text-warning-700',
}
>>>>>>> 69dd190b0bbe9e1b599cb3fa6242e2df87a7cda8

export default function Destinations({ onViewDestination }) {
  const articleFromHash = () => destinationArticles.find((article) => window.location.hash === `#news/${article.slug}`) ?? null
  const [selectedArticle, setSelectedArticle] = useState(articleFromHash)
  const [search, setSearch] = useState('')
  const visibleArticles = destinationArticles.filter((article) =>
    `${article.name} ${article.headline} ${article.description}`.toLowerCase().includes(search.trim().toLowerCase()))

  useEffect(() => {
    const syncArticle = () => setSelectedArticle(articleFromHash())
    window.addEventListener('popstate', syncArticle)
    window.addEventListener('hashchange', syncArticle)
    return () => { window.removeEventListener('popstate', syncArticle); window.removeEventListener('hashchange', syncArticle) }
  }, [])

  const openArticle = (article) => {
    window.history.pushState({}, '', `#news/${article.slug}`)
    setSelectedArticle(article)
  }

  const closeArticle = () => {
    window.history.pushState({}, '', '#news')
    setSelectedArticle(null)
  }

  return (
<<<<<<< HEAD
    <section
      aria-labelledby="destinations-title"
      className="bg-white py-20 sm:py-28 relative"
      id="destinations"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          badge="Global Destinations"
          badgeClassName="bg-primary-100 text-primary-800"
          description="Explore high-demand destination countries with clear admission tracks and post-study opportunities."
          id="destinations-title"
          title="Top International Study Destinations"
        />

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map(({ name, tier, avgCost, workRights, highlight }) => (
            <li
              className="group rounded-3xl border border-secondary-200/80 bg-surface p-6 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-primary-300 hover:shadow-xl hover:bg-white flex flex-col justify-between"
              key={name}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-secondary-950 group-hover:text-primary-600 transition">
                    {name}
                  </h3>
                  <span className="rounded-lg bg-primary-50 border border-primary-200 px-2.5 py-0.5 text-[10px] font-bold text-primary-800">
                    {tier}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-semibold text-secondary-600">
                  <div className="rounded-xl bg-white border border-secondary-200/70 p-2.5">
                    <span className="block text-[10px] text-secondary-400 uppercase font-bold">Avg. Tuition</span>
                    <span className="text-secondary-900 font-bold">{avgCost}</span>
                  </div>
                  <div className="rounded-xl bg-white border border-secondary-200/70 p-2.5">
                    <span className="block text-[10px] text-secondary-400 uppercase font-bold">Post-Study Visa</span>
                    <span className="text-secondary-900 font-bold">{workRights}</span>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-secondary-500">
                  {highlight}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-secondary-200/60 flex items-center justify-between">
                <button
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 transition"
                  onClick={() => onViewDestination?.(name)}
                  type="button"
                >
                  <span>Explore Universities</span>
                  <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </button>
              </div>
=======
    <>
      <section
      aria-labelledby="news-title"
      className="bg-surface py-20 sm:py-24"
      id="news"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          badge="FutureWings Newsroom"
          badgeClassName="bg-success/10 text-success"
          description="Independent, easy-to-read guides covering costs, admissions, visas, work options, and student life in every featured destination. No login required."
          id="news-title"
          title="Study Abroad News & Destination Guides"
        />

        <div className="mx-auto mt-8 max-w-xl">
          <label className="sr-only" htmlFor="news-search">Search destination articles</label>
          <input className="w-full rounded-xl border border-secondary-200 bg-white px-4 py-3 text-sm text-secondary-950 shadow-sm outline-none transition placeholder:text-secondary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" id="news-search" onChange={(event) => setSearch(event.target.value)} placeholder="Search news by country or topic" type="search" value={search} />
          <p aria-live="polite" className="mt-2 text-center text-xs text-secondary-400">{visibleArticles.length} article{visibleArticles.length === 1 ? '' : 's'} available</p>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleArticles.map((article) => (
            <li
              className="group overflow-hidden rounded-2xl border border-secondary-500/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary-500/30 hover:shadow-md"
              key={article.slug}
            >
              <div className="flex h-24 items-center justify-between bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 px-6"><span className="flex items-center gap-2.5 font-serif text-xl font-black tracking-tight text-white/95"><span aria-hidden="true" className="text-2xl leading-none">{article.flag}</span><span>{article.name}</span></span><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">News analysis</span></div>
              <div className="p-6"><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-bold text-secondary-950">{article.name}</h3><span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${tierStyles[article.tier]}`}>{article.tier}</span></div><p className="mt-3 text-sm leading-6 text-secondary-500">{article.description}</p><p className="mt-3 line-clamp-2 font-serif text-base font-bold leading-6 text-secondary-800">{article.headline}</p><button className="mt-5 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-primary-500 transition group-hover:gap-2.5 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2" onClick={() => openArticle(article)} type="button">Read full article<span className="sr-only"> about {article.name}</span><ArrowRightIcon className="h-3.5 w-3.5" /></button></div>
>>>>>>> 69dd190b0bbe9e1b599cb3fa6242e2df87a7cda8
            </li>
          ))}
        </ul>
        {visibleArticles.length === 0 && <div className="mt-10 rounded-2xl border border-dashed border-secondary-300 bg-white px-6 py-12 text-center"><p className="font-semibold text-secondary-950">No articles match that search.</p><button className="mt-3 rounded-lg px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500" onClick={() => setSearch('')} type="button">Clear search</button></div>}
      </div>
      </section>
      {selectedArticle && <DestinationArticle article={selectedArticle} onClose={closeArticle} onExplore={(name) => { closeArticle(); onViewDestination?.(name) }} />}
    </>
  )
}
