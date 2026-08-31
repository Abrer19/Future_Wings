/**
 * Shared section header: eyebrow pill + title + supporting line.
 *
 * Every homepage section uses this instead of re-inlining the same three-element
 * block, and it takes an explicit `id` so each <section> can be labelled by its
 * own heading via aria-labelledby.
 *
 * `badgeClassName` is passed in as a complete literal class string rather than
 * composed from a variable — Tailwind only generates arbitrary values it can find
 * as literal text in the source, so `bg-[${color}]` would silently produce no CSS.
 */
export default function SectionHeading({ badge, badgeClassName, title, id, description }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span
        className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${badgeClassName}`}
      >
        {badge}
      </span>
      <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-secondary-950 sm:text-4xl" id={id}>
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-secondary-500 sm:text-base">
        {description}
      </p>
    </div>
  )
}
