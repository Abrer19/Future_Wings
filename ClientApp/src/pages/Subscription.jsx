import { useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { BTN_PRIMARY, CARD, FOCUS } from '../components/ui/styles.js'

const tierAccent = {
  Free: 'text-secondary-600',
  Pro: 'text-primary-600',
  Premium: 'text-accent-600',
}

export default function Subscription({ session, subscription, onSubscriptionChange }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyTier, setBusyTier] = useState('')
  // Stripe returns the browser here with ?checkout=success|cancelled. Read it once
  // during initialisation (and strip it from the URL) rather than in an effect.
  const [checkoutOutcome] = useState(() => {
    const outcome = new URLSearchParams(window.location.search).get('checkout')
    if (outcome) window.history.replaceState({}, '', window.location.pathname)
    return outcome
  })
  const [toast, setToast] = useState(() =>
    checkoutOutcome === 'success' ? 'Payment received — your plan is being activated.'
      : checkoutOutcome === 'cancelled' ? 'Checkout cancelled.'
        : '')

  useEffect(() => {
    let active = true
    apiRequest('/subscription/plans', { token: session.token })
      .then((data) => { if (active) setPlans(data) })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [session.token])

  // Re-fetch entitlements after a successful payment (calls a prop, sets no state here).
  useEffect(() => {
    if (checkoutOutcome === 'success') onSubscriptionChange?.()
  }, [checkoutOutcome, onSubscriptionChange])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const upgrade = async (tier) => {
    setBusyTier(tier)
    setError('')
    try {
      const { checkoutUrl } = await apiRequest('/subscription/checkout', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ tier, returnUrl: window.location.origin }),
      })
      // Hand off to Stripe's hosted checkout.
      window.location.assign(checkoutUrl)
    } catch (requestError) {
      setError(requestError.message)
      setBusyTier('')
    }
  }

  const currentTier = subscription?.tier ?? 'Free'

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Plans</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-secondary-950">Choose your plan</h1>
        <p className="mt-2 text-secondary-500">
          You&rsquo;re on the <span className="font-semibold text-secondary-900">{currentTier}</span> plan.
          {subscription?.renewsAt && ` Renews ${new Date(subscription.renewsAt).toLocaleDateString()}.`}
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
          {error}
        </div>
      )}

      {subscription && subscription.stripeConfigured === false && (
        <div className="mb-6 rounded-2xl border border-warning-100 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          Payments aren&rsquo;t switched on yet, so upgrades are unavailable. Everything on the Free
          plan works normally.
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-3">
          {[1, 2, 3].map((card) => <div className={`h-80 animate-pulse ${CARD}`} key={card} />)}
        </div>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.tier === currentTier
            const isFree = plan.monthlyPriceUsd === 0
            return (
              <li className={`flex flex-col p-6 ${CARD} ${isCurrent ? 'ring-2 ring-primary-500' : ''}`} key={plan.tier}>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className={`text-lg font-bold ${tierAccent[plan.tier] ?? 'text-secondary-900'}`}>{plan.name}</h2>
                  {isCurrent && (
                    <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-700">
                      Current plan
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-secondary-500">{plan.description}</p>
                <p className="mt-4 text-3xl font-bold text-secondary-950">
                  ${plan.monthlyPriceUsd}
                  <span className="text-sm font-medium text-secondary-500">/month</span>
                </p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {plan.highlights.map((highlight) => (
                    <li className="flex items-start gap-2 text-sm text-secondary-600" key={highlight}>
                      <span aria-hidden="true" className="mt-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600">
                        <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                          <path d="m5 12.5 4.5 4.5L19 7" />
                        </svg>
                      </span>
                      {highlight}
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <p className="text-sm font-medium text-secondary-500">You&rsquo;re on this plan.</p>
                  ) : isFree ? (
                    <p className="text-sm text-secondary-500">Included by default.</p>
                  ) : (
                    <button
                      className={`w-full ${BTN_PRIMARY} ${FOCUS}`}
                      disabled={!plan.purchasable || busyTier === plan.tier}
                      onClick={() => upgrade(plan.tier)}
                      type="button"
                    >
                      {busyTier === plan.tier ? 'Opening checkout…' : `Upgrade to ${plan.name}`}
                    </button>
                  )}
                  {!isCurrent && !isFree && !plan.purchasable && (
                    <p className="mt-2 text-xs text-secondary-400">Unavailable until payments are configured.</p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Toast message={toast} />
    </div>
  )
}
