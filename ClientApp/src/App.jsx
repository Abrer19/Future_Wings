import { useState } from 'react'
import Admin from './pages/Admin.jsx'
import Applications from './pages/Applications.jsx'
import Community from './pages/Community.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Discovery from './pages/Discovery.jsx'
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
  const [activePage, setActivePage] = useState('Dashboard')
  const ActivePage = pages[activePage]

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-gray-200 bg-white px-4 py-5 lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600 text-sm font-bold text-white">FW</div>
          <div>
            <p className="font-semibold text-gray-950">FutureWings</p>
            <p className="text-xs text-gray-500">Student workspace</p>
          </div>
        </div>
        <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1" aria-label="Main navigation">
          {Object.keys(pages).map((page) => (
            <button
              className={`rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                activePage === page
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-950'
              }`}
              key={page}
              onClick={() => setActivePage(page)}
              type="button"
            >
              {page}
            </button>
          ))}
        </nav>
      </aside>
      <main className="p-5 sm:p-8 lg:p-10">
        <ActivePage />
      </main>
    </div>
  )
}

export default App
