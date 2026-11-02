import SiteHeader from '../components/home/SiteHeader.jsx'
import Hero from '../components/home/Hero.jsx'
import TrustMetrics from '../components/home/TrustMetrics.jsx'
import ProblemSolution from '../components/home/ProblemSolution.jsx'
import ProductFeatures from '../components/home/ProductFeatures.jsx'
import HowItWorks from '../components/home/HowItWorks.jsx'
import Destinations from '../components/home/Destinations.jsx'
import Testimonials from '../components/home/Testimonials.jsx'
import Faq from '../components/home/Faq.jsx'
import ClosingCta from '../components/home/ClosingCta.jsx'
import SiteFooter from '../components/home/SiteFooter.jsx'
import { useInterFont } from '../components/home/useInterFont.js'

/**
 * Public marketing homepage.
 *
 * Fully responsive, accessible, GSAP-animated marketing landing page
 * for FutureWings international student application workspace.
 *
 * Callbacks:
 * - onSignIn: Navigates to Login page/modal
 * - onSignUp: Navigates to Registration page/modal
 * - onGetRecommendations: Navigates to Recommendations intake or Registration
 * - onExploreCountries: Navigates to Country Discovery or Registration
 * - onViewDestination: Navigates to filtered university list for destination
 * - onNavigate: Navigates to any target page
 */
export default function Home({
  onSignIn,
  onSignUp,
  onGetRecommendations,
  onExploreCountries,
  onViewDestination,
  onNavigate,
  session,
  isAuthenticated = false,
}) {
  useInterFont()

  const handleNavigate = onNavigate ?? ((page) => {
    if (page === 'Login') onSignIn?.()
    else if (page === 'Register') onSignUp?.()
  })

  return (
    <div className="min-h-screen bg-surface text-secondary-950 font-sans selection:bg-primary-500 selection:text-white overflow-x-hidden">
      {/* Accessible skip link */}
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg focus:outline-none"
        href="#main"
      >
        Skip to main content
      </a>

      {/* Sticky Header */}
      <SiteHeader
        isAuthenticated={isAuthenticated}
        onNavigate={handleNavigate}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        session={session}
      />

      <main id="main">
        {/* Section 3: Hero Section */}
        <Hero
          onExploreCountries={onExploreCountries}
          onGetRecommendations={onGetRecommendations}
        />

        {/* Section 4: Trust & Metrics */}
        <TrustMetrics />

        {/* Section 5: The Fragmented Way vs The FutureWings Way */}
        <ProblemSolution />

        {/* Section 6: Deep Feature Showcase */}
        <ProductFeatures />

        {/* Section 7: 4-Step Progressive Timeline */}
        <HowItWorks />

        {/* Section 8: Destination Showcase */}
        <Destinations onViewDestination={onViewDestination} />

        {/* Section 9: Authentic Student Stories */}
        <Testimonials />

        {/* Section 10: Accessible FAQ Accordion */}
        <Faq />

        {/* Section 11: Closing High-Conversion CTA */}
        <ClosingCta onSignUp={onSignUp} onSignIn={onSignIn} />
      </main>

      {/* Section 12: Structured Editorial Footer */}
      <SiteFooter />
    </div>
  )
}
