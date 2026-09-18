import { useEffect, useState } from 'react'
import DestinationArticle from './DestinationArticle.jsx'
import SectionHeading from './SectionHeading.jsx'
import { ArrowRightIcon } from './icons.jsx'
import { destinationArticles } from './destinationArticles.js'

const tierStyles = {
  'Tier 1': 'bg-primary-500/10 text-primary-500',
  'Tier 2': 'bg-warning/15 text-warning-700',
}

export default function Destinations({ onViewDestination }) {
  const articleFromHash = () => destinationArticles.find((article) => window.location.hash === `#news/${article.slug}`) ?? null
  const [selectedArticle, setSelectedArticle] = useState(articleFromHash)

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

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {destinationArticles.map((article) => (
            <li
              className="group overflow-hidden rounded-2xl border border-secondary-500/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary-500/30 hover:shadow-md"
              key={article.slug}
            >
              <div className="flex h-24 items-center justify-between bg-gradient-to-br from-secondary-950 to-secondary-700 px-6"><span className="text-5xl drop-shadow" aria-hidden="true">{article.flag}</span><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">News analysis</span></div>
              <div className="p-6"><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-bold text-secondary-950">{article.name}</h3><span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${tierStyles[article.tier]}`}>{article.tier}</span></div><p className="mt-3 text-sm leading-6 text-secondary-500">{article.description}</p><p className="mt-3 line-clamp-2 font-serif text-base font-bold leading-6 text-secondary-800">{article.headline}</p><button className="mt-5 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-primary-500 transition group-hover:gap-2.5 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2" onClick={() => openArticle(article)} type="button">Read full article<span className="sr-only"> about {article.name}</span><ArrowRightIcon className="h-3.5 w-3.5" /></button></div>
            </li>
          ))}
        </ul>
      </div>
      </section>
      {selectedArticle && <DestinationArticle article={selectedArticle} onClose={closeArticle} onExplore={(name) => { closeArticle(); onViewDestination?.(name) }} />}
    </>
  )
}
