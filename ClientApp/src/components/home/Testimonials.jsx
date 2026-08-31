import { useState } from 'react'
import SectionHeading from './SectionHeading.jsx'
import { ChevronLeftIcon, ChevronRightIcon, StarFilledIcon } from './icons.jsx'

const stories = [
  {
    quote:
      'FutureWings matched me with three Tier 1 universities I had never considered. The tier system made the whole search feel manageable instead of overwhelming.',
    name: 'Amara Nwosu',
    route: 'Nigeria → Canada',
    rating: 5,
  },
  {
    quote:
      'I got a fully-funded scholarship in Munich thanks to the country-specific scholarship feature. Couldn’t have done it without this platform.',
    name: 'Daniel Osei',
    route: 'Ghana → Germany',
    rating: 5,
  },
  {
    quote:
      'The document verification step caught two problems with my transcripts before I submitted. That alone saved my application timeline.',
    name: 'Priya Raman',
    route: 'India → Australia',
    rating: 5,
  },
]

export default function Testimonials() {
  const [index, setIndex] = useState(1)
  const story = stories[index]

  const go = (next) => setIndex((next + stories.length) % stories.length)

  // Left/right arrows move between slides when focus is inside the carousel,
  // which is the behaviour keyboard users expect from a rotating region.
  const onKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(index - 1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(index + 1)
    }
  }

  return (
    <section
      aria-labelledby="testimonials-title"
      className="bg-surface py-20 sm:py-24"
      id="testimonials"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          badge="Testimonials"
          badgeClassName="bg-secondary-500/10 text-secondary-500"
          description="Real outcomes from students who planned their move with FutureWings."
          id="testimonials-title"
          title="Student Stories"
        />

        <div
          aria-roledescription="carousel"
          className="mx-auto mt-12 max-w-2xl"
          onKeyDown={onKeyDown}
          role="group"
        >
          <div className="flex items-center gap-3">
            <button
              aria-label="Previous story"
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-secondary-500/15 bg-white text-secondary-500 transition hover:border-primary-500/40 hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:flex"
              onClick={() => go(index - 1)}
              type="button"
            >
              <ChevronLeftIcon />
            </button>

            <blockquote
              aria-live="polite"
              className="flex-1 rounded-2xl border border-secondary-500/10 bg-white px-6 py-8 text-center shadow-sm sm:px-10"
            >
              <p className="flex items-center justify-center gap-1 text-warning">
                <span className="sr-only">{story.rating} out of 5 stars</span>
                {Array.from({ length: story.rating }, (_, star) => (
                  <StarFilledIcon key={star} />
                ))}
              </p>
              <p className="mt-5 text-sm italic leading-7 text-secondary-950 sm:text-base">
                &ldquo;{story.quote}&rdquo;
              </p>
              <footer className="mt-6">
                <p className="text-sm font-bold text-secondary-950">{story.name}</p>
                <p className="mt-1 text-xs text-secondary-500">{story.route}</p>
              </footer>
            </blockquote>

            <button
              aria-label="Next story"
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-secondary-500/15 bg-white text-secondary-500 transition hover:border-primary-500/40 hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:flex"
              onClick={() => go(index + 1)}
              type="button"
            >
              <ChevronRightIcon />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            {stories.map((item, dot) => (
              <button
                aria-current={dot === index ? 'true' : undefined}
                aria-label={`Show story ${dot + 1} of ${stories.length}`}
                className={
                  dot === index
                    ? 'h-2 w-6 rounded-full bg-primary-500 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
                    : 'h-2 w-2 rounded-full bg-secondary-500/25 transition hover:bg-secondary-500/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'
                }
                key={item.name}
                onClick={() => setIndex(dot)}
                type="button"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
