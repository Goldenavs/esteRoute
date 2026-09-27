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
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route index element={<BlockageSubmissionForm />} />
          <Route path="confirmation" element={<SubmissionConfirmation />} />
          <Route path="public-map" element={<PublicEsteroStatusMap />} />
          <Route path="dashboard" element={<CitizenDashboard />} />
        </Route>

        {/* Admin Routing Group */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<MainCommandDashboard />} />
          <Route path="analytics" element={<LGUAnalyticsOverview />} />
          <Route path="archive" element={<HistoricalArchiveView />} />
        </Route>

        {/* Fallback to Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
