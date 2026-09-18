import { Link } from 'react-router-dom'

export default function PasswordRecovery() { 
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center relative">
        <Link to="/login" className="absolute top-4 left-4 text-sm text-blue-600 hover:underline">
          &larr; Back to Login
        </Link>
        <h2 className="text-2xl font-bold mt-6 mb-4">Password Recovery</h2>
        <p className="text-gray-600 mb-6">Enter your email and we'll send you a reset link.</p>
        <div className="space-y-4">
          <input type="email" placeholder="Email Address" className="w-full p-3 border rounded" />
          <Link to="/login" className="block w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition-colors">
            Send Reset Link
          </Link>
        </div>
      </div>
    </div>
  )
}
