import { useCallback, useEffect, useRef, useState } from 'react'
import { apiRequest, clearSession, loadSession, saveSession } from './auth.js'
import LockedFeature from './components/ui/LockedFeature.jsx'
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

// Which paid feature each page needs. Pages absent from this map are always available.
// Keys must match the feature keys the server returns from GET /api/subscription/me.
const PAGE_FEATURE = {
  Roadmap: 'roadmap',
  'AI Interview': 'aiInterview',
}

// Only used for the upgrade prompt's wording.
const FEATURE_TIER = { roadmap: 'Pro', aiInterview: 'Premium' }

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

  const features = subscription?.features ?? []
  const isLocked = (page) => {
    const required = PAGE_FEATURE[page]
    return Boolean(required) && !features.includes(required)
  }

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

  const navPages = Object.keys(pages).filter((page) =>
    page !== 'Login' && page !== 'Register' && (page !== 'Admin' || session.role === 'Admin')
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      {/* Below lg this is a sticky top bar that collapses to ~60px; from lg it is the
          full-height sidebar. Previously the expanded nav consumed ~379px of vertical
          space on a phone before any page content appeared. */}
      <aside className="sticky top-0 z-30 border-b border-secondary-200 bg-white px-4 py-3 lg:static lg:min-h-screen lg:border-b-0 lg:border-r lg:py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 px-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-500 text-sm font-bold text-white">FW</div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-secondary-950">FutureWings</p>
              <p className="truncate text-xs text-secondary-500">Student workspace</p>
            </div>
          </div>
          <button
            aria-controls="workspace-nav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-secondary-600 transition hover:bg-secondary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            ref={menuButtonRef}
            type="button"
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.75" viewBox="0 0 24 24">
              {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        <div className={`${menuOpen ? 'block' : 'hidden'} lg:block`} id="workspace-nav">
          <nav className="mt-4 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:mt-6 lg:grid-cols-1" aria-label="Main navigation">
            {navPages.map((page) => (
              <button
                aria-current={activePage === page ? 'page' : undefined}
                className={`flex min-h-11 items-center rounded-md px-3 py-2 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  activePage === page
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-950'
                }`}
                key={page}
                onClick={() => goTo(page)}
                type="button"
              >
                <span className="flex-1 truncate">{page}</span>
                {isLocked(page) && (
                  <span aria-label="(requires an upgrade)" className="ml-2 shrink-0 text-secondary-400" role="img" title="Requires an upgrade">
                    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                      <rect height="10" rx="2" width="14" x="5" y="11" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="mt-6 border-t border-secondary-200 px-2 pt-4 lg:mt-8">
            <p className="truncate text-sm font-medium text-secondary-900">{session.firstName} {session.lastName}</p>
            <p className="truncate text-xs text-secondary-500">{session.email}</p>
            <span className="mt-2 mr-1 inline-flex rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-600">{session.role ?? 'Student'}</span>
            <span className="mt-2 inline-flex rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">{subscription?.tier ?? 'Free'}</span>
            <button
              className="mt-3 flex min-h-11 w-full items-center rounded-md px-1 text-sm font-medium text-danger-600 transition hover:bg-danger-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              onClick={handleLogout}
              type="button"
            >
              Log out
            </button>
          </div>
        </div>
      </aside>
      <main className="p-4 sm:p-6 lg:p-10">
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
