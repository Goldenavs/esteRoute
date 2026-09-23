import { Link } from 'react-router-dom'

export default function UniversalLogin() { 
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative">
        <Link to="/" className="absolute top-4 left-4 text-sm text-blue-600 hover:underline">
          &larr; Back to Public Form
        </Link>
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold mb-6">Sign In</h2>
          <div className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-3 border border-gray-300 rounded" />
            <input type="password" placeholder="Password" className="w-full p-3 border border-gray-300 rounded" />
            
            <div className="flex gap-2">
              <Link to="/citizen-dashboard" className="flex-1 bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition-colors text-center">
                Login as Citizen
              </Link>
              <Link to="/admin-dashboard" className="flex-1 bg-indigo-600 text-white p-3 rounded font-bold hover:bg-indigo-700 transition-colors text-center">
                Login as Admin
              </Link>
            </div>
          </div>
          <div className="mt-6 text-sm text-gray-500 flex justify-between">
            <Link to="/recovery" className="hover:underline">Forgot password?</Link>
            <Link to="/register" className="hover:underline text-blue-600">Register as Citizen</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
