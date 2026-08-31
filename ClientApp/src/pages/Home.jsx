import ClosingCta from '../components/home/ClosingCta.jsx'
import Destinations from '../components/home/Destinations.jsx'
import Faq from '../components/home/Faq.jsx'
import Features from '../components/home/Features.jsx'
import Hero from '../components/home/Hero.jsx'
import HowItWorks from '../components/home/HowItWorks.jsx'
import SiteFooter from '../components/home/SiteFooter.jsx'
import SiteHeader from '../components/home/SiteHeader.jsx'
import Testimonials from '../components/home/Testimonials.jsx'
import { useInterFont } from '../components/home/useInterFont.js'

/**
 * Public marketing homepage.
 *
 * NOT yet wired into App.jsx — this is a standalone component pending review.
 * When integrating, note that App.jsx currently renders <AuthPage> whenever
 * `session` is null, so this page needs to sit *before* that gate to be reachable
 * by signed-out visitors.
 *
 * Every callback is optional and defaults to a no-op, so the page renders and is
 * fully interactive with no props at all:
 *
 *   <Home />
 *   <Home onSignUp={() => setActivePage('Register')} onSignIn={() => setActivePage('Login')} />
 *
 * Colors come from the shared design tokens in tailwind.config.js
 * (primary / secondary / accent / success / warning / danger / surface), which
 * the rest of the app now uses too — so this page and the signed-in workspace
 * stay in sync from one place.
 */
export default function Home({
  onSignIn,
  onSignUp,
  onGetRecommendations,
  onExploreCountries,
  onViewDestination,
}) {
  useInterFont()

  return (
    <div className="min-h-screen bg-surface text-secondary-950">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        href="#main"
      >
        Skip to main content
      </a>

      <SiteHeader onSignIn={onSignIn} onSignUp={onSignUp} />

      <main id="main">
        <Hero onExploreCountries={onExploreCountries} onGetRecommendations={onGetRecommendations} />
        <Features />
        <HowItWorks />
        <Destinations onViewDestination={onViewDestination} />
        <Testimonials />
        <Faq />
        <ClosingCta onSignUp={onSignUp} />
      </main>

      <SiteFooter />
    </div>
  )
}
