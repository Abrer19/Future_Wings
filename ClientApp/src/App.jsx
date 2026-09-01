import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest, clearSession, loadSession, saveSession } from './auth.js'
import LockedFeature from './components/ui/LockedFeature.jsx'
import NavIcon from './components/ui/navIcons.jsx'
import Admin from './pages/Admin.jsx'
import AiInterview from './pages/AiInterview.jsx'
import Applications from './pages/Applications.jsx'
import Community from './pages/Community.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Discovery from './pages/Discovery.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Profile from './pages/Profile.jsx'
import Recommendations from './pages/Recommendations.jsx'
import Register from './pages/Register.jsx'
import Roadmap from './pages/Roadmap.jsx'
import Scholarships from './pages/Scholarships.jsx'
import Subscription from './pages/Subscription.jsx'
import VisaCheck from './pages/VisaCheck.jsx'

const pages = {
  Dashboard,
  Roadmap,
  Discovery,
  Profile,
  Recommendations,
  Applications,
  'Visa Check': VisaCheck,
  Scholarships,
  Community,
  'AI Interview': AiInterview,
  Plans: Subscription,
  Admin,
  Login,
  Register,
}

/**
 * Navigation grouped by intent rather than one flat list of twelve links.
 * Grouping is what makes a long sidebar scannable, and the labels follow the mental
 * model a student already has: get oriented, look around, apply, manage the account.
 */
const NAV_GROUPS = [
  { label: 'Overview', items: ['Dashboard', 'Roadmap'] },
  { label: 'Explore', items: ['Discovery', 'Recommendations', 'Scholarships', 'Community'] },
  { label: 'Apply', items: ['Applications', 'Visa Check', 'AI Interview'] },
  { label: 'Account', items: ['Profile', 'Plans', 'Admin'] },
]

// Which paid feature each page needs. Pages absent from this map are always available.
// Keys must match the feature keys the server returns from GET /api/subscription/me.
const PAGE_FEATURE = {
  Roadmap: 'roadmap',
  'AI Interview': 'aiInterview',
}

// Only used for the upgrade prompt's wording.
const FEATURE_TIER = { roadmap: 'Pro', aiInterview: 'Premium' }

const initials = (session) =>
  `${session.firstName?.[0] ?? ''}${session.lastName?.[0] ?? ''}`.toUpperCase() || 'FW'

function App() {
  const [session, setSession] = useState(loadSession)
  const [activePage, setActivePage] = useState(session ? 'Dashboard' : 'Home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const menuButtonRef = useRef(null)
  const ActivePage = pages[activePage]

  // Entitlements drive which nav items are unlocked. Until this resolves the user is
  // treated as Free, so a paid page is never briefly exposed on a slow network.
  const loadSubscription = useCallback(() => {
    if (!session?.token) return
    apiRequest('/subscription/me', { token: session.token })
      .then(setSubscription)
      .catch(() => setSubscription({ tier: 'Free', features: [] }))
  }, [session])

  useEffect(() => { loadSubscription() }, [loadSubscription])

  // Below lg the nav is a collapsible drawer; Escape closes it and returns focus to
  // the control that opened it so keyboard users are never stranded inside it.
  useEffect(() => {
    if (!menuOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  const features = subscription?.features ?? []
  const isLocked = (page) => {
    const required = PAGE_FEATURE[page]
    return Boolean(required) && !features.includes(required)
  }

  const handleAuthenticated = (nextSession) => {
    saveSession(nextSession)
    setSession(nextSession)
    setActivePage('Dashboard')
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
    setSubscription(null)
    setActivePage('Home')
    setMenuOpen(false)
  }

  const goTo = (page) => {
    setActivePage(page)
    setMenuOpen(false)
  }

  if (!session) {
    // Signed-out visitors land on the public homepage. Login/Register are reached
    // from its header, so 'Home' is kept out of the `pages` object above to stop it
    // appearing in the signed-in sidebar nav.
    if (activePage !== 'Login' && activePage !== 'Register') {
      return (
        <Home
          onExploreCountries={() => setActivePage('Register')}
          onGetRecommendations={() => setActivePage('Register')}
          onSignIn={() => setActivePage('Login')}
          onSignUp={() => setActivePage('Register')}
          onViewDestination={() => setActivePage('Register')}
        />
      )
    }

    const AuthPage = activePage === 'Register' ? Register : Login
    return <AuthPage onAuthenticated={handleAuthenticated} onNavigate={() => setActivePage(activePage === 'Register' ? 'Login' : 'Register')} />
  }

  const visibleGroups = NAV_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((page) => page !== 'Admin' || session.role === 'Admin'),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[248px_1fr]">
      {/* Below lg this collapses to a ~60px top bar; from lg it is the full-height
          sidebar. The rail separates from content with a hairline border rather than a
          shadow — product chrome reads cleaner separated by edge than by elevation. */}
      <aside className="sticky top-0 z-30 border-b border-secondary-200/80 bg-white px-3 py-3 lg:static lg:flex lg:min-h-screen lg:flex-col lg:border-b-0 lg:border-r lg:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5 px-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-[13px] font-bold text-white">FW</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight text-secondary-950">FutureWings</p>
              <p className="truncate text-[11px] text-secondary-400">Student workspace</p>
            </div>
          </div>
          <button
            aria-controls="workspace-nav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-secondary-500 transition hover:bg-secondary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            ref={menuButtonRef}
            type="button"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" viewBox="0 0 24 24">
              {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        <div className={`${menuOpen ? 'block' : 'hidden'} lg:flex lg:min-h-0 lg:flex-1 lg:flex-col`} id="workspace-nav">
          <nav aria-label="Main navigation" className="mt-3 lg:mt-5 lg:flex-1 lg:overflow-y-auto">
            {visibleGroups.map((group) => (
              <div className="mb-4 last:mb-0" key={group.label}>
                <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-secondary-400">
                  {group.label}
                </p>
                <ul className="grid grid-cols-2 gap-0.5 sm:grid-cols-3 lg:grid-cols-1">
                  {group.items.map((page) => {
                    const active = activePage === page
                    const locked = isLocked(page)
                    return (
                      <li key={page}>
                        <button
                          aria-current={active ? 'page' : undefined}
                          className={`group flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                            active
                              ? 'bg-secondary-100 text-secondary-950'
                              : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-950'
                          }`}
                          onClick={() => goTo(page)}
                          type="button"
                        >
                          <span className={active ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-600'}>
                            <NavIcon page={page} />
                          </span>
                          <span className="flex-1 truncate">{page}</span>
                          {locked && (
                            <span aria-label="(requires an upgrade)" className="shrink-0 text-secondary-300" role="img" title="Requires an upgrade">
                              <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                                <rect height="10" rx="2" width="14" x="5" y="11" />
                                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                              </svg>
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-4 border-t border-secondary-200/80 pt-3 lg:mt-0">
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-[11px] font-bold text-secondary-600">
                {initials(session)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-secondary-900">{session.firstName} {session.lastName}</p>
                <p className="truncate text-[11px] text-secondary-400">{session.email}</p>
              </div>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 px-2">
              <span className="inline-flex rounded-md bg-secondary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-500">
                {session.role ?? 'Student'}
              </span>
              <button
                className="inline-flex rounded-md bg-primary-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-700 transition hover:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                onClick={() => goTo('Plans')}
                type="button"
              >
                {subscription?.tier ?? 'Free'}
              </button>
            </div>

            <button
              className="mt-2 flex min-h-9 w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] font-medium text-secondary-500 transition hover:bg-secondary-50 hover:text-danger-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              onClick={handleLogout}
              type="button"
            >
              <svg aria-hidden="true" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24">
                <path d="M14.5 8.5V6a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2.5" />
                <path d="M10 12h10M17 9l3 3-3 3" />
              </svg>
              Log out
            </button>
          </div>
        </div>
      </aside>

      <main className="p-4 sm:p-6 lg:p-8 xl:p-10">
        {isLocked(activePage) ? (
          <LockedFeature
            onUpgrade={() => goTo('Plans')}
            page={activePage}
            requiredTier={FEATURE_TIER[PAGE_FEATURE[activePage]] ?? 'Pro'}
          />
        ) : (
          <ActivePage
            onNavigate={goTo}
            onSubscriptionChange={loadSubscription}
            session={session}
            subscription={subscription}
          />
        )}
      </main>
    </div>
  )
}

export default App
