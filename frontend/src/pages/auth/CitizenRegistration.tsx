import { Link } from 'react-router-dom'

export default function CitizenRegistration() { 
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center relative">
        <Link to="/login" className="absolute top-4 left-4 text-sm text-blue-600 hover:underline">
          &larr; Back to Login
        </Link>
        <h2 className="text-2xl font-bold mt-6 mb-6">Citizen Registration</h2>
        <div className="space-y-4">
          <input type="text" placeholder="Full Name" className="w-full p-3 border rounded" />
          <input type="email" placeholder="Email" className="w-full p-3 border rounded" />
          <input type="password" placeholder="Password" className="w-full p-3 border rounded" />
          <Link to="/citizen-dashboard" className="block w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700 transition-colors">
            Register Account
          </Link>
        </div>
      </div>
    </div>
  )
}
