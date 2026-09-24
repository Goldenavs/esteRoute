import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthLayout from './layouts/AuthLayout'
import CitizenLayout from './layouts/CitizenLayout'
import AdminLayout from './layouts/AdminLayout'

// Auth Pages
import UniversalLogin from './pages/auth/UniversalLogin'
import CitizenRegistration from './pages/auth/CitizenRegistration'
import PasswordRecovery from './pages/auth/PasswordRecovery'

// Citizen Pages
import BlockageSubmissionForm from './pages/citizen/BlockageSubmissionForm'
import SubmissionConfirmation from './pages/citizen/SubmissionConfirmation'
import PublicEsteroStatusMap from './pages/citizen/PublicEsteroStatusMap'
import CitizenDashboard from './pages/citizen/CitizenDashboard'

// Admin Pages
import MainCommandDashboard from './pages/admin/MainCommandDashboard'
import LGUAnalyticsOverview from './pages/admin/LGUAnalyticsOverview'
import HistoricalArchiveView from './pages/admin/HistoricalArchiveView'

import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routing Group */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<UniversalLogin />} />
          <Route path="/register" element={<CitizenRegistration />} />
          <Route path="/recovery" element={<PasswordRecovery />} />
        </Route>

        {/* Citizen Routing Group */}
        <Route element={<CitizenLayout />}>
          <Route path="/" element={<BlockageSubmissionForm />} />
          <Route path="/confirmation" element={<SubmissionConfirmation />} />
          <Route path="/public-map" element={<PublicEsteroStatusMap />} />
          <Route path="/citizen-dashboard" element={<CitizenDashboard />} />
        </Route>

        {/* Admin Routing Group */}
        <Route element={<AdminLayout />}>
          <Route path="/admin-dashboard" element={<MainCommandDashboard />} />
          <Route path="/analytics" element={<LGUAnalyticsOverview />} />
          <Route path="/archive" element={<HistoricalArchiveView />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
