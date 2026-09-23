import { Link } from 'react-router-dom'

export default function SubmissionConfirmation() { 
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Report Submitted!</h2>
        <p className="text-gray-600 mb-6">Tracking Reference: #ER-9821</p>
        <div className="bg-gray-50 p-4 rounded mb-6 text-sm text-gray-700">
          <p><strong>AI Preliminary Estimate:</strong> High Severity</p>
          <p>Dispatched to queue.</p>
        </div>
        <div className="space-y-3">
          <Link to="/public-map" className="block w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition-colors">
            View on Public Map
          </Link>
          <Link to="/" className="block w-full bg-gray-200 text-gray-800 p-3 rounded font-bold hover:bg-gray-300 transition-colors">
            Submit Another Report
          </Link>
        </div>
      </div>
    </div>
  )
}
