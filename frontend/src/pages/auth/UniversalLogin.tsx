import { Link } from 'react-router-dom'

export default function UniversalLogin() { 
  return (
    <div className="w-full flex justify-center">
      <div className="bg-surface border border-border-subtle text-text-primary p-8 rounded-2xl shadow-xl w-full max-w-md relative">
        <div className="mt-4 text-center">
          <h2 className="text-3xl font-heading font-bold mb-8">Sign In</h2>
          <div className="space-y-4">
            <input type="email" placeholder="Email" className="w-full p-3 bg-app-bg border border-border-subtle rounded-xl text-text-primary outline-none focus:border-brand-primary transition-colors" />
            <input type="password" placeholder="Password" className="w-full p-3 bg-app-bg border border-border-subtle rounded-xl text-text-primary outline-none focus:border-brand-primary transition-colors" />
            
            <div className="flex gap-2 pt-4">
              <Link to="/citizen" className="flex-1 bg-brand-primary text-brand-white p-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-center text-sm sm:text-base">
                Login (Citizen)
              </Link>
              <Link to="/admin" className="flex-1 bg-brand-dark text-brand-white p-3 rounded-xl font-bold hover:opacity-90 transition-opacity text-center text-sm sm:text-base">
                Login (Admin)
              </Link>
            </div>
          </div>
          <div className="mt-8 text-sm text-text-secondary flex justify-between">
            <Link to="/recovery" className="hover:text-brand-primary transition-colors">Forgot password?</Link>
            <Link to="/register" className="text-brand-primary font-bold hover:opacity-80 transition-opacity">Register as Citizen</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
