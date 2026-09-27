import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Mail, User, ArrowRight } from 'lucide-react';

interface AuthModalsProps {
  activeModal: 'admin' | 'citizen' | null;
  onClose: () => void;
}

export default function AuthModals({ activeModal, onClose }: AuthModalsProps) {
  const navigate = useNavigate();
  const [citizenMode, setCitizenMode] = useState<'login' | 'signup'>('login');

  // Hardcoded Admin Auth
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername === 'admin' && adminPassword === 'password123') {
      navigate('/admin');
    } else {
      setAdminError('Invalid credentials. Hint: admin / password123');
    }
  };

  // Mock Citizen Auth
  const handleCitizenAuth = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/citizen');
  };

  const handleGuestLogin = () => {
    navigate('/citizen');
  };

  if (!activeModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-app-bg/80 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-surface border-2 border-border-subtle shadow-2xl overflow-hidden -skew-x-3 z-10"
        >
          <div className="skew-x-3 h-full flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b-2 border-border-subtle flex items-center justify-between bg-surface-subtle">
              <h3 className="text-xl font-heading font-black uppercase tracking-widest text-text-primary">
                {activeModal === 'admin' ? 'LGU Command Login' : (citizenMode === 'login' ? 'Citizen Login' : 'Citizen Sign Up')}
              </h3>
              <button
                onClick={onClose}
                className="p-2 text-text-secondary hover:text-brand-primary transition-colors bg-surface border-2 border-border-subtle hover:border-brand-primary cursor-pointer -skew-x-12"
              >
                <div className="skew-x-12">
                  <X className="w-5 h-5" />
                </div>
              </button>
            </div>

            {/* Body */}
            <div className="p-8">
              
              {/* ADMIN LOGIN */}
              {activeModal === 'admin' && (
                <form onSubmit={handleAdminLogin} className="space-y-6">
                  {adminError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm font-medium">
                      {adminError}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <input
                        type="text"
                        required
                        placeholder="Username"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full bg-surface-subtle border-2 border-border-subtle pl-10 pr-4 py-3 text-text-primary focus:outline-none focus:border-brand-dark transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <input
                        type="password"
                        required
                        placeholder="Password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-surface-subtle border-2 border-border-subtle pl-10 pr-4 py-3 text-text-primary focus:outline-none focus:border-brand-dark transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-brand-dark text-text-primary px-8 py-4 font-bold hover:shadow-lg hover:shadow-brand-dark/40 transition-all hover:-translate-y-1"
                  >
                    Authenticate
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              )}

              {/* CITIZEN AUTH */}
              {activeModal === 'citizen' && (
                <div className="space-y-6">
                  <form onSubmit={handleCitizenAuth} className="space-y-4">
                    {citizenMode === 'signup' && (
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                          type="text"
                          required
                          placeholder="Full Name"
                          className="w-full bg-surface-subtle border-2 border-border-subtle pl-10 pr-4 py-3 text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                        />
                      </div>
                    )}
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        className="w-full bg-surface-subtle border-2 border-border-subtle pl-10 pr-4 py-3 text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <input
                        type="password"
                        required
                        placeholder="Password"
                        className="w-full bg-surface-subtle border-2 border-border-subtle pl-10 pr-4 py-3 text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 bg-brand-primary text-text-primary px-8 py-4 font-bold hover:shadow-lg hover:shadow-brand-primary/40 transition-all hover:-translate-y-1"
                    >
                      {citizenMode === 'login' ? 'Login' : 'Sign Up'}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-border-subtle"></div>
                    <span className="flex-shrink-0 mx-4 text-text-muted text-xs font-bold uppercase tracking-widest">OR</span>
                    <div className="flex-grow border-t border-border-subtle"></div>
                  </div>

                  <button
                    onClick={handleGuestLogin}
                    className="w-full flex items-center justify-center bg-surface-subtle border-2 border-border-subtle text-text-secondary px-8 py-4 font-bold hover:border-text-primary hover:text-text-primary transition-colors"
                  >
                    Continue as Guest
                  </button>

                  <div className="text-center mt-6">
                    <p className="text-sm text-text-secondary">
                      {citizenMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                      <button
                        onClick={() => setCitizenMode(citizenMode === 'login' ? 'signup' : 'login')}
                        className="text-brand-primary font-bold hover:underline"
                      >
                        {citizenMode === 'login' ? 'Sign up' : 'Login'}
                      </button>
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
