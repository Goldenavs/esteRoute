import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { useTheme } from './context/ThemeContext'
import UniversalLogin from './pages/auth/UniversalLogin'
import CitizenRegistration from './pages/auth/CitizenRegistration'
import PasswordRecovery from './pages/auth/PasswordRecovery'
import BlockageSubmissionForm from './pages/citizen/BlockageSubmissionForm'
import SubmissionConfirmation from './pages/citizen/SubmissionConfirmation'
import PublicEsteroStatusMap from './pages/citizen/PublicEsteroStatusMap'
import CitizenDashboard from './pages/citizen/CitizenDashboard'
import MainCommandDashboard from './pages/admin/MainCommandDashboard'
import LGUAnalyticsOverview from './pages/admin/LGUAnalyticsOverview'
import HistoricalArchiveView from './pages/admin/HistoricalArchiveView'

import './App.css'

function DevMenu() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { theme, toggleTheme } = useTheme();

  const getLinkClass = (path: string) => {
    return currentPath === path 
      ? "text-yellow-400 font-bold underline decoration-2 underline-offset-4" 
      : "hover:text-red-300 transition-colors";
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-900 text-white p-3 text-xs z-50 border-t-2 border-red-500 opacity-95 hover:opacity-100 transition-opacity">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <span className="font-bold text-red-400 uppercase tracking-widest mr-6">DEV MENU</span>
          <span className="space-x-4">
            <Link to="/" className={getLinkClass("/")}>Submit Form</Link>
            <Link to="/login" className={getLinkClass("/login")}>Login</Link>
            <Link to="/register" className={getLinkClass("/register")}>Register</Link>
            <Link to="/recovery" className={getLinkClass("/recovery")}>Recovery</Link>
            <Link to="/confirmation" className={getLinkClass("/confirmation")}>Confirm</Link>
            <Link to="/public-map" className={getLinkClass("/public-map")}>Public Map</Link>
            <Link to="/citizen-dashboard" className={getLinkClass("/citizen-dashboard")}>Citizen DB</Link>
            <Link to="/admin-dashboard" className={getLinkClass("/admin-dashboard")}>Admin DB</Link>
            <Link to="/analytics" className={getLinkClass("/analytics")}>Analytics</Link>
            <Link to="/archive" className={getLinkClass("/archive")}>Archive</Link>
          </span>
        </div>
        <button 
          onClick={toggleTheme}
          className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded font-bold transition-colors"
        >
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col relative pb-16">
        {/* Route Configuration */}
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<BlockageSubmissionForm />} />
            <Route path="/login" element={<UniversalLogin />} />
            <Route path="/register" element={<CitizenRegistration />} />
            <Route path="/recovery" element={<PasswordRecovery />} />
            <Route path="/confirmation" element={<SubmissionConfirmation />} />
            <Route path="/public-map" element={<PublicEsteroStatusMap />} />
            <Route path="/citizen-dashboard" element={<CitizenDashboard />} />
            <Route path="/admin-dashboard" element={<MainCommandDashboard />} />
            <Route path="/analytics" element={<LGUAnalyticsOverview />} />
            <Route path="/archive" element={<HistoricalArchiveView />} />
          </Routes>
        </main>
        
        {/* State-aware dev menu */}
        <DevMenu />
      </div>
    </Router>
  )
}

export default App
