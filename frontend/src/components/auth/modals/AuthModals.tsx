import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Mail, User, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface AuthModalsProps {
  activeModal: 'admin' | 'citizen' | null;
  onClose: () => void;
}

export default function AuthModals({ activeModal, onClose }: AuthModalsProps) {
  const navigate = useNavigate();
  const [citizenMode, setCitizenMode] = useState<'login' | 'signup'>('login');

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);



  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      setAdminError('Please fill in all required fields.');
      return;
    }
    setIsLoading(true);
    setAdminError('');

    if (adminEmail === 'admin@lgu.gov.ph' && adminPassword === 'admin') {
      navigate('/admin');
    } else {
      setAdminError('Invalid Dispatcher Credentials. Use admin@lgu.gov.ph / admin');
    }
  };

  // Citizen Auth
  const [citizenName, setCitizenName] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [citizenPassword, setCitizenPassword] = useState('');
  const [citizenError, setCitizenError] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  // Clear state when modal closes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!activeModal) {
      setCitizenMode('login');
      setAdminEmail('');
      setAdminPassword('');
      setAdminError('');
      setCitizenName('');
      setCitizenEmail('');
      setCitizenPassword('');
      setCitizenError('');
      setShowEmailConfirmation(false);
      setShowPassword(false);
      setIsLoading(false);
    }
  }, [activeModal]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCitizenAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenEmail || !citizenPassword || (citizenMode === 'signup' && !citizenName)) {
      setCitizenError('Please fill in all required fields.');
      return;
    }
    setIsLoading(true);
    setCitizenError('');

    if (citizenMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: citizenEmail,
        password: citizenPassword,
        options: {
          data: { full_name: citizenName },
          emailRedirectTo: `${window.location.origin}/citizen`
        }
      });
      if (error) {
        setCitizenError(error.message);
      } else if (data.user && !data.session) {
        setShowEmailConfirmation(true);
      } else {
        navigate('/citizen');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: citizenEmail,
        password: citizenPassword,
      });
      if (error) setCitizenError(error.message);
      else navigate('/citizen');
    }
    setIsLoading(false);
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
          className="relative w-full max-w-md bg-surface border-2 border-border-subtle shadow-2xl overflow-hidden z-10"
        >
          <div className="h-full flex flex-col">
            
            {/* Header */}
            <div className="p-6 border-b-2 border-border-subtle flex items-center justify-between bg-surface-subtle">
              <h3 className="text-xl font-heading font-black uppercase tracking-widest text-text-primary">
                {activeModal === 'admin' ? 'LGU Command Login' : (citizenMode === 'login' ? 'Citizen Login' : 'Citizen Sign Up')}
              </h3>
              <button
                onClick={onClose}
                className="p-2 text-text-secondary hover:text-brand-primary transition-colors bg-surface border-2 border-border-subtle hover:border-brand-primary cursor-pointer"
              >
                <div>
                  <X className="w-5 h-5" />
                </div>
              </button>
            </div>

            {/* Body */}
            <div className="p-8">
              
              {/* ADMIN LOGIN */}
              {activeModal === 'admin' && (
                <form onSubmit={handleAdminLogin} className="flex flex-col gap-6" noValidate>
                  <AnimatePresence>
                    {adminError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm font-medium mt-1">
                          {adminError}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <span className="absolute left-8 top-2 text-red-500 font-bold">*</span>
                      <input
                        type="email"
                        required
                        placeholder="Admin Email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full bg-surface-subtle border-2 border-border-subtle pl-10 pr-4 py-3 text-text-primary focus:outline-none focus:border-brand-dark transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <span className="absolute left-8 top-2 text-red-500 font-bold">*</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-surface-subtle border-2 border-border-subtle pl-10 pr-12 py-3 text-text-primary focus:outline-none focus:border-brand-dark transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                      >
                        {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center bg-text-primary text-app-bg px-8 py-4 font-bold hover:shadow-lg hover:shadow-text-primary/40 transition-all hover:-translate-y-1 -skew-x-12 border-2 border-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="skew-x-12 flex items-center gap-2">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
                      {!isLoading && <ArrowRight className="w-5 h-5" />}
                    </div>
                  </button>
                </form>
              )}

              {/* CITIZEN AUTH */}
              {activeModal === 'citizen' && (
                <div className="space-y-6">
                  {showEmailConfirmation ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                      <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-8 h-8 text-brand-primary" />
                      </div>
                      <h4 className="text-xl font-heading font-bold text-text-primary">Check Your Email</h4>
                      <p className="text-text-secondary">
                        We sent a confirmation link to <span className="font-bold text-text-primary">{citizenEmail}</span>.
                      </p>
                      <p className="text-sm text-text-muted mt-2">
                        Please click the link to confirm your account. You will be automatically signed in!
                      </p>
                      <button
                        onClick={onClose}
                        className="mt-6 w-full flex items-center justify-center bg-surface-subtle border-2 border-border-subtle text-text-primary px-8 py-4 font-bold hover:border-brand-primary transition-colors -skew-x-12"
                      >
                        <div className="skew-x-12">Close</div>
                      </button>
                    </div>
                  ) : (
                    <>
                      <AnimatePresence>
                        {citizenError && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm font-medium">
                              {citizenError}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                  <form onSubmit={handleCitizenAuth} className="flex flex-col gap-4" noValidate>
                    <AnimatePresence>
                      {citizenMode === 'signup' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="relative overflow-hidden"
                        >
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                          <span className="absolute left-8 top-2 text-red-500 font-bold">*</span>
                          <input
                            type="text"
                            required
                            placeholder="Full Name"
                            value={citizenName}
                            onChange={(e) => setCitizenName(e.target.value)}
                            className="w-full bg-surface-subtle border-2 border-border-subtle pl-10 pr-4 py-3 text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <span className="absolute left-8 top-2 text-red-500 font-bold">*</span>
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={citizenEmail}
                        onChange={(e) => setCitizenEmail(e.target.value)}
                        className="w-full bg-surface-subtle border-2 border-border-subtle pl-10 pr-4 py-3 text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <span className="absolute left-8 top-2 text-red-500 font-bold">*</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Password"
                        value={citizenPassword}
                        onChange={(e) => setCitizenPassword(e.target.value)}
                        className="w-full bg-surface-subtle border-2 border-border-subtle pl-10 pr-12 py-3 text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                      >
                        {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    <AnimatePresence>
                      {citizenMode === 'signup' && citizenPassword.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-1.5 overflow-hidden"
                        >
                          <div className="flex gap-1 h-1.5 w-full">
                            {[1, 2, 3, 4].map((level) => {
                              let score = 0;
                              if (citizenPassword.length > 5) score += 1;
                              if (citizenPassword.length > 7) score += 1;
                              if (/[A-Z]/.test(citizenPassword) || /[0-9]/.test(citizenPassword)) score += 1;
                              if (/[^A-Za-z0-9]/.test(citizenPassword)) score += 1;
                              const strength = Math.min(score, 4);
                              
                              let bgClass = "bg-border-subtle";
                              if (strength >= level) {
                                if (strength <= 1) bgClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]";
                                else if (strength === 2) bgClass = "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]";
                                else if (strength === 3) bgClass = "bg-brand-primary shadow-[0_0_8px_rgba(59,130,246,0.4)]";
                                else bgClass = "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]";
                              }
                              return (
                                <div key={level} className={`flex-1 rounded-sm transition-all duration-300 ${bgClass}`} />
                              )
                            })}
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-text-muted">Min 6 chars</span>
                            <span className="font-heading font-bold uppercase tracking-wider">
                              {(() => {
                                let score = 0;
                                if (citizenPassword.length > 5) score += 1;
                                if (citizenPassword.length > 7) score += 1;
                                if (/[A-Z]/.test(citizenPassword) || /[0-9]/.test(citizenPassword)) score += 1;
                                if (/[^A-Za-z0-9]/.test(citizenPassword)) score += 1;
                                const strength = Math.min(score, 4);
                                if (strength <= 1) return <span className="text-red-500">Weak</span>;
                                if (strength === 2) return <span className="text-yellow-500">Fair</span>;
                                if (strength === 3) return <span className="text-brand-primary">Good</span>;
                                return <span className="text-green-500">Strong</span>;
                              })()}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center bg-text-primary text-app-bg px-8 py-4 font-bold hover:shadow-lg hover:shadow-text-primary/40 transition-all hover:-translate-y-1 -skew-x-12 border-2 border-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="skew-x-12 flex items-center gap-2">
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (citizenMode === 'login' ? 'Login' : 'Sign Up')}
                        {!isLoading && <ArrowRight className="w-5 h-5" />}
                      </div>
                    </button>
                  </form>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-border-subtle"></div>
                    <span className="flex-shrink-0 mx-4 text-text-muted text-xs font-bold uppercase tracking-widest">OR</span>
                    <div className="flex-grow border-t border-border-subtle"></div>
                  </div>

                  <button
                    onClick={handleGuestLogin}
                    className="w-full flex items-center justify-center bg-surface-subtle border-2 border-border-subtle text-text-secondary px-8 py-4 font-bold hover:border-text-primary hover:text-text-primary transition-colors -skew-x-12"
                  >
                    <div className="skew-x-12 flex items-center gap-2">
                      Continue as Guest
                    </div>
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
                  </>
                  )}
                </div>
              )}

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
