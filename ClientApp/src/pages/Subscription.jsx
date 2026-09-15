import { useEffect, useState } from 'react'
import { apiRequest } from '../auth.js'
import Toast from '../components/ui/Toast.jsx'
import { BTN_PRIMARY, CARD, FOCUS } from '../components/ui/styles.js'

const tierAccent = {
  Free: 'text-secondary-600',
  Pro: 'text-primary-600',
  Premium: 'text-accent-600',
}

function StripeDemoModal({ isOpen, onClose, plan, onConfirm, busy, publishableKey }) {
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242')
  const [expiry, setExpiry] = useState('12 / 28')
  const [cvc, setCvc] = useState('123')
  const [name, setName] = useState('Demo Student')

  if (!isOpen || !plan) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary-950/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-secondary-100">
        {/* Stripe Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500 font-black text-xs text-white shadow-sm">
                S
              </div>
              <span className="text-sm font-semibold tracking-wide text-indigo-200 uppercase">Stripe Checkout Demo</span>
            </div>
            <button
              onClick={onClose}
              disabled={busy}
              type="button"
              className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition focus:outline-none"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-4">
            <p className="text-xs text-indigo-300 font-medium">Subscribe to FutureWings</p>
            <div className="mt-1 flex items-baseline justify-between">
              <h3 className="text-2xl font-bold">{plan.name} Tier</h3>
              <span className="text-2xl font-extrabold text-white">${plan.monthlyPriceUsd}<span className="text-sm font-normal text-indigo-200">/mo</span></span>
            </div>
          </div>
        </div>

        {/* Demo Details Body */}
        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-600 space-y-1">
            <div className="flex items-center justify-between text-slate-700 font-medium">
              <span>Environment:</span>
              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                Stripe Test / Demo
              </span>
            </div>
            <div className="truncate text-[11px] text-slate-500">
              <span className="font-semibold text-slate-600">Key: </span>
              <code className="bg-slate-200/70 px-1 rounded font-mono">{publishableKey || 'pk_test_demo_51FutureWingsDemoPublishableKey889201'}</code>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-secondary-700 uppercase tracking-wider mb-1">
                Card Information (Demo Test Card)
              </label>
              <div className="relative rounded-lg border border-secondary-300 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <div className="flex items-center px-3 py-2 border-b border-secondary-200">
                  <svg className="h-5 w-5 text-secondary-400 mr-2 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-transparent text-sm font-mono text-secondary-900 focus:outline-none"
                    placeholder="4242 4242 4242 4242"
                  />
                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">TEST</span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-secondary-200">
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="px-3 py-2 text-sm font-mono text-secondary-900 bg-transparent focus:outline-none"
                    placeholder="MM / YY"
                  />
                  <input
                    type="text"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    className="px-3 py-2 text-sm font-mono text-secondary-900 bg-transparent focus:outline-none"
                    placeholder="CVC"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondary-700 uppercase tracking-wider mb-1">
                Name on Card
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm text-secondary-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Cardholder name"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onConfirm(plan.tier)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {busy ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing Demo Payment...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Pay ${plan.monthlyPriceUsd}.00 & Upgrade (Demo)
                </>
              )}
            </button>
            <p className="mt-2 text-center text-[11px] text-secondary-400">
              🔒 Simulated checkout with Stripe test keys. No real charge is made.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Subscription({ session, subscription, onSubscriptionChange }) {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyTier, setBusyTier] = useState('')
  const [selectedDemoPlan, setSelectedDemoPlan] = useState(null)

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

  const simulated = subscription?.simulationEnabled === true || subscription?.isDemoMode === true
  const publishableKey = subscription?.publishableKey || 'pk_test_demo_51FutureWingsDemoPublishableKey889201'

  const handleOpenUpgrade = (plan) => {
    if (simulated) {
      setSelectedDemoPlan(plan)
    } else {
      executeDirectCheckout(plan.tier)
    }
  }

  const executeDirectCheckout = async (tier) => {
    setBusyTier(tier)
    setError('')
    try {
      const { checkoutUrl } = await apiRequest('/subscription/checkout', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ tier, returnUrl: window.location.origin }),
      })
      window.location.assign(checkoutUrl)
    } catch (requestError) {
      setError(requestError.message)
      setBusyTier('')
    }
  }

  const executeDemoPayment = async (tier) => {
    setBusyTier(tier)
    setError('')
    try {
      await apiRequest('/subscription/simulate-checkout', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ tier }),
      })
      onSubscriptionChange?.()
      setSelectedDemoPlan(null)
      setToast(`Demo Stripe payment confirmed — upgraded to ${tier}!`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusyTier('')
    }
  }

  // Test-mode only: lets the tiers be demoed repeatedly without a database edit.
  const downgrade = async () => {
    setBusyTier('Free')
    setError('')
    try {
      await apiRequest('/subscription/simulate-checkout', {
        token: session.token,
        method: 'POST',
        body: JSON.stringify({ tier: 'Free' }),
      })
      setToast('Returned to Free tier.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      onSubscriptionChange?.()
      setBusyTier('')
    }
  }

  const currentTier = subscription?.tier ?? 'Free'

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600">Plans & Billing</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-secondary-950">Choose your plan</h1>
        <p className="mt-2 text-secondary-500">
          You&rsquo;re currently on the <span className="font-semibold text-secondary-900">{currentTier}</span> plan.
          {subscription?.renewsAt && ` Renews ${new Date(subscription.renewsAt).toLocaleDateString()}.`}
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
          {error}
        </div>
      )}

      {/* Stripe Demo Mode Banner */}
      {subscription && simulated && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-900 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white">
              S
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-950">Stripe Demo Keys Active</span>
                <span className="rounded bg-indigo-200/70 px-1.5 py-0.5 text-[10px] font-mono font-bold text-indigo-800">
                  {publishableKey}
                </span>
              </div>
              <p className="text-xs text-indigo-700 mt-0.5">
                Simulated checkout enabled for demo presentations. Test cards (e.g. <code className="font-mono bg-indigo-100 px-1 rounded">4242 4242 4242 4242</code>) work instantly.
              </p>
            </div>
          </div>
          {currentTier !== 'Free' && (
            <button
              onClick={() => downgrade()}
              disabled={busyTier === 'Free'}
              className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50 transition"
              type="button"
            >
              {busyTier === 'Free' ? 'Resetting...' : 'Reset to Free Tier'}
            </button>
          )}
        </div>
      )}

      {subscription && !simulated && subscription.stripeConfigured === false && (
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
              <li className={`flex flex-col p-6 ${CARD} ${isCurrent ? 'ring-2 ring-primary-500 shadow-md' : ''}`} key={plan.tier}>
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
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-medium text-secondary-500">You&rsquo;re currently on this plan.</p>
                      {simulated && !isFree && (
                        <button
                          className="text-xs font-semibold text-secondary-500 hover:text-secondary-700 underline text-left"
                          disabled={busyTier === 'Free'}
                          onClick={() => downgrade()}
                          type="button"
                        >
                          {busyTier === 'Free' ? 'Resetting…' : 'Switch back to Free (Demo)'}
                        </button>
                      )}
                    </div>
                  ) : isFree ? (
                    simulated ? (
                      <button
                        className={`w-full rounded-lg border border-secondary-200 px-4 py-2.5 text-sm font-semibold text-secondary-700 transition hover:border-secondary-300 disabled:opacity-60 ${FOCUS}`}
                        disabled={busyTier === 'Free'}
                        onClick={() => downgrade()}
                        type="button"
                      >
                        {busyTier === 'Free' ? 'Applying…' : 'Switch back to Free'}
                      </button>
                    ) : <p className="text-sm text-secondary-500">Included by default.</p>
                  ) : (
                    <button
                      className={`w-full ${BTN_PRIMARY} ${FOCUS}`}
                      disabled={!plan.purchasable || busyTier === plan.tier}
                      onClick={() => handleOpenUpgrade(plan)}
                      type="button"
                    >
                      {busyTier === plan.tier
                        ? 'Processing...'
                        : simulated
                          ? `Upgrade to ${plan.name} (Stripe Demo)`
                          : `Upgrade to ${plan.name}`}
                    </button>
                  )}
                  {!isCurrent && !isFree && !plan.purchasable && (
                    <p className="mt-2 text-xs text-secondary-400">Unavailable until payments are configured.</p>
                  )}
                  {!isCurrent && !isFree && plan.purchasable && simulated && (
                    <p className="mt-2 text-xs text-secondary-400">⚡ Instant test checkout with demo key.</p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Interactive Stripe Demo Checkout Modal */}
      <StripeDemoModal
        isOpen={Boolean(selectedDemoPlan)}
        onClose={() => setSelectedDemoPlan(null)}
        plan={selectedDemoPlan}
        onConfirm={executeDemoPayment}
        busy={Boolean(busyTier)}
        publishableKey={publishableKey}
      />

      <Toast message={toast} />
    </div>
  )
}
