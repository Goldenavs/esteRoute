import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
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

// Skeletons for Modals just to verify they exist
import UserProfileSettings from './components/modals/UserProfileSettings'
import ManualGPSOverride from './components/modals/ManualGPSOverride'
import IncidentDetailSlideOver from './components/modals/IncidentDetailSlideOver'
import CrewAssignmentStatus from './components/modals/CrewAssignmentStatus'
import AIDiagnosticsAudit from './components/modals/AIDiagnosticsAudit'
import DynamicWeightCalibration from './components/modals/DynamicWeightCalibration'

import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col">
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
      </div>
    </Router>
  )
}

export default App
