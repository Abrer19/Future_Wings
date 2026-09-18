import { useEffect, useRef } from 'react'
import { ArrowRightIcon, CloseIcon } from './icons.jsx'

export default function DestinationArticle({ article, onClose, onExplore }) {
  const closeRef = useRef(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKeyDown) }
  }, [onClose])

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-secondary-950/70 p-0 backdrop-blur-sm sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }} role="presentation">
    <article aria-labelledby="article-title" aria-modal="true" className="mx-auto min-h-screen max-w-4xl bg-[#fffdfa] shadow-2xl sm:min-h-0 sm:rounded-2xl" role="dialog">
      <header className="relative overflow-hidden border-b border-secondary-200 bg-secondary-950 px-6 py-10 text-white sm:px-12 sm:py-14">
        <div className="absolute -right-10 -top-16 text-[13rem] opacity-10" aria-hidden="true">{article.flag}</div>
        <button aria-label="Close article" className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white" onClick={onClose} ref={closeRef} type="button"><CloseIcon /></button>
        <div className="relative max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-300">FutureWings destination report · {article.tier}</p><h1 className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-6xl" id="article-title">{article.headline}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-secondary-200">{article.standfirst}</p><div className="mt-7 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wider text-secondary-300"><span>{article.updated}</span><span aria-hidden="true">•</span><span>{article.readTime}</span></div></div>
      </header>

      <div className="px-6 py-8 sm:px-12 sm:py-12">
        <div className="grid divide-y divide-secondary-200 border-y border-secondary-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">{article.stats.map(([label, value]) => <div className="py-4 sm:px-5 sm:first:pl-0" key={label}><p className="text-[11px] font-bold uppercase tracking-wider text-secondary-400">{label}</p><p className="mt-1 font-serif text-xl font-bold text-secondary-950">{value}</p></div>)}</div>
        <div className="mx-auto mt-10 max-w-2xl">{article.sections.map(([heading, copy], index) => <section className="mb-9" key={heading}><div className="flex items-baseline gap-3"><span className="font-serif text-3xl font-bold text-primary-500/30">0{index + 1}</span><h2 className="font-serif text-2xl font-bold text-secondary-950">{heading}</h2></div><p className={`mt-4 text-base leading-8 text-secondary-700 ${index === 0 ? 'first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-6xl first-letter:font-bold first-letter:leading-[.85] first-letter:text-primary-500' : ''}`}>{copy}</p></section>)}
          <aside className="my-10 border-y-4 border-double border-secondary-300 py-7"><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-600">Before you shortlist</p><h2 className="mt-2 font-serif text-2xl font-bold text-secondary-950">A practical research checklist</h2><ul className="mt-5 grid gap-3 sm:grid-cols-2">{article.checklist.map((item) => <li className="flex gap-2 text-sm leading-6 text-secondary-700" key={item}><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-500" />{item}</li>)}</ul></aside>
          <p className="text-xs leading-5 text-secondary-400">Costs, immigration rules and work rights change. Use this article as a planning overview and confirm current requirements with universities and official government sources before applying.</p>
        </div>
      </div>
      <footer className="sticky bottom-0 flex flex-col gap-3 border-t border-secondary-200 bg-white/95 px-6 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-12"><div><p className="font-semibold text-secondary-950">Ready to explore {article.name}?</p><p className="text-sm text-secondary-500">Compare programs matched to your goals.</p></div><button className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2" onClick={() => onExplore(article.name)} type="button">Explore programs <ArrowRightIcon className="h-4 w-4" /></button></footer>
    </article>
  </div>
}
