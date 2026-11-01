import { useCountUp, useScrollReveal } from '../../lib/useScrollAnimation.js'

export default function TrustMetrics() {
  const containerRef = useScrollReveal({ direction: 'up', distance: 20 })
  const count1Ref = useCountUp(1200, { suffix: '+' })
  const count2Ref = useCountUp(20, { suffix: '+' })
  const count3Ref = useCountUp(50, { suffix: 'M+' })
  const count4Ref = useCountUp(98, { suffix: '.4%' })

  return (
    <section
      id="metrics"
      aria-label="Platform reach and impact metrics"
      className="relative border-y border-secondary-200/80 bg-white py-12 sm:py-16"
      ref={containerRef}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-secondary-950 font-mono">
              <span ref={count1Ref}>1,200+</span>
            </p>
            <p className="text-xs sm:text-sm font-bold text-secondary-500">
              Universities & Degree Programs
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-primary-600 font-mono">
              <span ref={count2Ref}>20+</span>
            </p>
            <p className="text-xs sm:text-sm font-bold text-secondary-500">
              Global Destination Countries
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-secondary-950 font-mono">
              $<span ref={count3Ref}>50M+</span>
            </p>
            <p className="text-xs sm:text-sm font-bold text-secondary-500">
              Verified Scholarship Opportunities
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-emerald-600 font-mono">
              <span ref={count4Ref}>98.4%</span>
            </p>
            <p className="text-xs sm:text-sm font-bold text-secondary-500">
              Visa Readiness Accuracy
            </p>
          </div>
        </div>

        {/* Global recognition strip */}
        <div className="mt-10 border-t border-secondary-100 pt-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary-400">
            Admissions guidance trusted across Canada · United States · United Kingdom · Germany · Australia · Japan
          </p>
        </div>
      </div>
    </section>
  )
}
