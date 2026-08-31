import { useState } from 'react'
import { clearSession, loadSession, saveSession } from './auth.js'
import Admin from './pages/Admin.jsx'
import Applications from './pages/Applications.jsx'
import Community from './pages/Community.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Discovery from './pages/Discovery.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Recommendations from './pages/Recommendations.jsx'
import Register from './pages/Register.jsx'
import Scholarships from './pages/Scholarships.jsx'
import VisaCheck from './pages/VisaCheck.jsx'

const pages = {
  Dashboard,
  Discovery,
  Recommendations,
  Applications,
  'Visa Check': VisaCheck,
  Scholarships,
  Community,
  Admin,
  Login,
  Register,
}

function App() {
  const [session, setSession] = useState(loadSession)
  const [activePage, setActivePage] = useState(session ? 'Dashboard' : 'Home')
  const ActivePage = pages[activePage]

  const handleAuthenticated = (nextSession) => {
    saveSession(nextSession)
    setSession(nextSession)
    setActivePage('Dashboard')
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
    setActivePage('Home')
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

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-secondary-200 bg-white px-4 py-5 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-500 text-sm font-bold text-white">FW</div>
          <div>
            <p className="font-semibold text-secondary-950">FutureWings</p>
            <p className="text-xs text-secondary-500">Student workspace</p>
          </div>
        </div>
        <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1" aria-label="Main navigation">
          {Object.keys(pages).filter((page) =>
            page !== 'Login' && page !== 'Register' && (page !== 'Admin' || session.role === 'Admin')
          ).map((page) => (
            <button
              className={`rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                activePage === page
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-950'
              }`}
              key={page}
              onClick={() => setActivePage(page)}
              type="button"
            >
              {page}
            </button>
          ))}
        </nav>
        <div className="mt-8 border-t border-secondary-200 px-2 pt-4">
          <p className="truncate text-sm font-medium text-secondary-900">{session.firstName} {session.lastName}</p>
          <p className="truncate text-xs text-secondary-500">{session.email}</p>
          <span className="mt-2 inline-flex rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-600">{session.role ?? 'Student'}</span>
          <button className="mt-3 text-sm font-medium text-red-600 hover:text-red-700" onClick={handleLogout} type="button">Log out</button>
        </div>
      </aside>
      <main className="p-5 sm:p-8 lg:p-10">
        <ActivePage session={session} />
      </main>
    </div>
  )
}

export default App
