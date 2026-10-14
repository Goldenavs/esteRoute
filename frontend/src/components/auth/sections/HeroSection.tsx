import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  ChevronDown,
  MapPin,
  Camera,
  Check
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../context/ThemeContext';

interface HeroSectionProps {
  activePortal: 'citizen' | 'admin';
  setActivePortal: (portal: 'citizen' | 'admin') => void;
  scrollTo: (id: string) => void;
}

export default function HeroSection({ activePortal, setActivePortal, scrollTo }: HeroSectionProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Admin Auth State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Citizen Auth State
  const [citizenMode, setCitizenMode] = useState<'login' | 'signup'>('login');
  const [citizenName, setCitizenName] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [citizenPassword, setCitizenPassword] = useState('');
  const [citizenError, setCitizenError] = useState('');
  const [isCitizenLoading, setIsCitizenLoading] = useState(false);
  const [showCitizenPassword, setShowCitizenPassword] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  // Admin Login Handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      setAdminError('Please fill in all required fields.');
      return;
    }
    setIsAdminLoading(true);
    setAdminError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (error) {
      setIsAdminLoading(false);
      setAdminError(error.message);
      return;
    }

    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'dispatcher')) {
        await supabase.auth.signOut();
        setAdminError('Access denied. Dispatcher/Admin role required.');
      } else {
        navigate('/admin');
      }
    }
    setIsAdminLoading(false);
  };

  // Citizen Auth Handler
  const handleCitizenAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenEmail || !citizenPassword || (citizenMode === 'signup' && !citizenName)) {
      setCitizenError('Please fill in all required fields.');
      return;
    }
    setIsCitizenLoading(true);
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
    setIsCitizenLoading(false);
  };

  return (
    <section 
      id="hero" 
      className="relative w-full h-screen min-h-[700px] overflow-hidden bg-app-bg flex flex-col justify-between"
    >
      {/* ========================================================= */}
      {/* SEAMLESS FULL-VIEWPORT BACKGROUND WITH SMOOTH CROSSFADE   */}
      {/* (Completely eliminates the split-seam artifact)           */}
      {/* ========================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out scale-105 ${
            activePortal === 'citizen' ? "bg-[url('/Auth/CitizenAuth.jpg')]" : "bg-[url('/Auth/AdminAuth.jpg')]"
          }`}
          style={{ opacity: 0.45 }}
        />
        {/* Balanced Vignette & Contrast Overlay so form inputs stay crisp */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/80 to-surface/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-primary/10 via-transparent to-transparent" />
      </div>

      {/* ========================================================= */}
      {/* BASE CANVAS (Left: Admin Form, Right: Citizen Form)       */}
      {/* ========================================================= */}
      <div className="relative w-full h-full flex flex-col md:block z-10">
        
        {/* Mobile Portal Tab Selector (< 768px) */}
        <div className="md:hidden z-30 pt-24 px-6 flex items-center justify-center gap-3 bg-app-bg/80 backdrop-blur-md pb-4">
          <button
            onClick={() => setActivePortal('citizen')}
            className={`flex-1 py-3 px-4 font-heading font-black text-xs uppercase tracking-widest -skew-x-12 border transition-all ${
              activePortal === 'citizen'
                ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/30'
                : 'bg-surface text-text-secondary border-border-subtle'
            }`}
          >
            <span className="skew-x-12 inline-block">Citizen Portal</span>
          </button>
          <button
            onClick={() => setActivePortal('admin')}
            className={`flex-1 py-3 px-4 font-heading font-black text-xs uppercase tracking-widest -skew-x-12 border transition-all ${
              activePortal === 'admin'
                ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/30'
                : 'bg-surface text-text-secondary border-border-subtle'
            }`}
          >
            <span className="skew-x-12 inline-block">LGU Command</span>
          </button>
        </div>

        {/* --------------------------------------------------------- */}
        {/* LEFT 50%: LGU Dispatcher Base Section                     */}
        {/* --------------------------------------------------------- */}
        <div className={`relative md:absolute md:left-0 md:top-0 w-full md:w-1/2 h-full overflow-hidden flex items-center justify-center p-8 lg:p-16 z-10 ${activePortal === 'admin' ? 'flex' : 'hidden md:flex'}`}>
          <div className="relative z-10 w-full max-w-md">
            <h2 className="text-3xl lg:text-4xl font-heading font-black text-text-primary uppercase tracking-tight mb-2">
              LGU Officer Sign In
            </h2>
            <p className="text-sm text-text-secondary mb-8 font-normal">
              Sanitation supervisors, dispatch officers, and fleet operators.
            </p>

            <form onSubmit={handleAdminLogin} className="flex flex-col gap-4" noValidate>
              <AnimatePresence>
                {adminError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/40 text-red-500 text-xs font-semibold"
                  >
                    {adminError}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  required
                  placeholder="Officer Email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-surface-subtle/90 border-2 border-border-subtle pl-10 pr-4 py-3 text-sm text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  placeholder="Security Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-surface-subtle/90 border-2 border-border-subtle pl-10 pr-10 py-3 text-sm text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 cursor-pointer"
                >
                  {showAdminPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isAdminLoading}
                className="w-full flex items-center justify-center bg-brand-primary text-white py-3.5 font-bold uppercase tracking-widest text-xs hover:shadow-lg hover:shadow-brand-primary/40 transition-all -skew-x-12 border-2 border-brand-primary disabled:opacity-50 cursor-pointer group mt-2"
              >
                <div className="skew-x-12 flex items-center gap-2">
                  {isAdminLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enter Dispatch Portal'}
                  {!isAdminLoading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                </div>
              </button>
            </form>

            {/* Consistent, Clean Footer */}
            <div className="mt-8 pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-secondary">
              <button
                type="button"
                onClick={() => navigate('/citizen/public-map')}
                className="text-text-secondary hover:text-text-primary flex items-center gap-1.5 font-medium cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                <span>Public Estero Map</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePortal('citizen')}
                className="text-brand-primary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Citizen Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* RIGHT 50%: Citizen Base Section                           */}
        {/* --------------------------------------------------------- */}
        <div className={`relative md:absolute md:right-0 md:top-0 w-full md:w-1/2 h-full overflow-hidden flex items-center justify-center p-8 lg:p-16 z-10 ${activePortal === 'citizen' ? 'flex' : 'hidden md:flex'}`}>
          <div className="relative z-10 w-full max-w-md">
            <h2 className="text-3xl lg:text-4xl font-heading font-black text-text-primary uppercase tracking-tight mb-2">
              {citizenMode === 'login' ? 'Citizen Sign In' : 'Create Account'}
            </h2>
            <p className="text-sm text-text-secondary mb-8 font-normal">
              Submit canal blockages and safeguard neighborhood waterways.
            </p>

            {showEmailConfirmation ? (
              <div className="p-6 bg-brand-primary/10 border border-brand-primary/30 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-brand-primary mx-auto" />
                <h4 className="font-heading font-bold text-text-primary">Confirmation Link Sent</h4>
                <p className="text-xs text-text-secondary">
                  Check <span className="font-bold text-text-primary">{citizenEmail}</span> to complete registration.
                </p>
                <button
                  onClick={() => setShowEmailConfirmation(false)}
                  className="text-xs font-bold text-brand-primary underline cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleCitizenAuth} className="flex flex-col gap-3.5" noValidate>
                  <AnimatePresence>
                    {citizenError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 bg-red-500/10 border border-red-500/40 text-red-500 text-xs font-semibold"
                      >
                        {citizenError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {citizenMode === 'signup' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative"
                      >
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          type="text"
                          required
                          placeholder="Full Name"
                          value={citizenName}
                          onChange={(e) => setCitizenName(e.target.value)}
                          className="w-full bg-surface-subtle/90 border-2 border-border-subtle pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={citizenEmail}
                      onChange={(e) => setCitizenEmail(e.target.value)}
                      className="w-full bg-surface-subtle/90 border-2 border-border-subtle pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type={showCitizenPassword ? 'text' : 'password'}
                      required
                      placeholder="Password"
                      value={citizenPassword}
                      onChange={(e) => setCitizenPassword(e.target.value)}
                      className="w-full bg-surface-subtle/90 border-2 border-border-subtle pl-10 pr-10 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCitizenPassword(!showCitizenPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 cursor-pointer"
                    >
                      {showCitizenPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isCitizenLoading}
                    className="w-full flex items-center justify-center bg-brand-primary text-white py-3 font-bold uppercase tracking-widest text-xs hover:shadow-lg hover:shadow-brand-primary/40 transition-all -skew-x-12 border-2 border-brand-primary disabled:opacity-50 cursor-pointer group mt-1"
                  >
                    <div className="skew-x-12 flex items-center gap-2">
                      {isCitizenLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (citizenMode === 'login' ? 'Login' : 'Create Account')}
                      {!isCitizenLoading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                    </div>
                  </button>
                </form>

                <div className="relative flex items-center my-3">
                  <div className="flex-grow border-t border-border-subtle"></div>
                  <span className="shrink-0 mx-3 text-text-muted text-[10px] font-bold uppercase tracking-widest">or quick report</span>
                  <div className="flex-grow border-t border-border-subtle"></div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/citizen')}
                  className="w-full flex items-center justify-center bg-surface-subtle border-2 border-border-subtle text-text-primary py-2.5 text-xs font-bold uppercase tracking-widest hover:border-brand-primary transition-colors -skew-x-12 cursor-pointer group"
                >
                  <div className="skew-x-12 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-brand-primary" />
                    <span>Continue as Guest (No Account)</span>
                  </div>
                </button>

                {/* Consistent, Clean Footer */}
                <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-secondary">
                  <button
                    type="button"
                    onClick={() => setCitizenMode(citizenMode === 'login' ? 'signup' : 'login')}
                    className="text-brand-primary font-bold hover:underline cursor-pointer"
                  >
                    {citizenMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePortal('admin')}
                    className="text-text-secondary hover:text-brand-primary font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>LGU Staff Access</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* OPPOSITE-THEME FROSTED GLASS SLIDING PARALLELOGRAM        */}
        {/* (Contrasts vividly against the base background)           */}
        {/* ========================================================= */}
        <motion.div
          className={`hidden md:flex absolute top-0 bottom-0 z-20 overflow-hidden backdrop-blur-3xl border-x transition-colors duration-500 flex-col justify-center ${
            isLight
              ? 'bg-[#0B1E36]/80 border-brand-primary/40 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)]'
              : 'bg-white/85 border-white/60 text-[#112D4E] shadow-[0_12px_40px_rgba(0,0,0,0.5)]'
          }`}
          style={{ width: '60vw' }}
          initial={false}
          animate={{
            x: activePortal === 'citizen' ? '-8vw' : '48vw',
            skewX: -12,
          }}
          transition={{ type: "spring", stiffness: 150, damping: 24 }}
        >
          {/* Subtle Opposite-Theme Frosted Glass Shimmer Overlay */}
          <div 
            className={`absolute inset-0 pointer-events-none ${
              isLight 
                ? 'bg-gradient-to-b from-white/10 via-transparent to-black/30' 
                : 'bg-gradient-to-b from-white/50 via-transparent to-black/5'
            }`} 
          />

          {/* Un-skewed Content Container with Dynamic Responsive Padding */}
          <div 
            className="relative z-10 flex flex-col justify-center py-16 transition-all duration-500"
            style={{ 
              transform: 'skewX(12deg)',
              paddingLeft: activePortal === 'citizen' ? '14vw' : '6vw',
              paddingRight: activePortal === 'citizen' ? '6vw' : '14vw',
            }}
          >
            <div className="max-w-lg">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePortal}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className={`text-3xl lg:text-5xl font-heading font-black tracking-tight uppercase leading-[1.08] mb-4 drop-shadow-sm ${
                    isLight ? 'text-white' : 'text-[#112D4E]'
                  }`}>
                    {activePortal === 'citizen' ? (
                      <>
                        Keep our <span className="text-brand-primary">esteros</span> clean. <br />
                        Protect communities from flash floods.
                      </>
                    ) : (
                      <>
                        Precision <span className="text-brand-primary">triage</span> & <br />
                        cleanup fleet dispatch.
                      </>
                    )}
                  </h1>

                  <p className={`text-sm lg:text-base leading-relaxed mb-8 font-normal max-w-md ${
                    isLight ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {activePortal === 'citizen'
                      ? 'Submit photos of canal obstructions in seconds. AI and rain forecast models automatically alert municipal cleanup crews.'
                      : 'Prioritized drainage response for sanitation units. Dynamic hazard ranking and optimized cleanup routing.'}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Minimalist Feature Points */}
              <div className={`space-y-3 max-w-md text-xs sm:text-sm font-medium ${
                isLight ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {activePortal === 'citizen' ? (
                  <>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isLight ? 'bg-white/10' : 'bg-brand-primary/10'
                      }`}>
                        <Check className="w-2.5 h-2.5 text-brand-primary" />
                      </div>
                      <span>Zero registration required to submit canal photos</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isLight ? 'bg-white/10' : 'bg-brand-primary/10'
                      }`}>
                        <Check className="w-2.5 h-2.5 text-brand-primary" />
                      </div>
                      <span>Automated 48h flood risk & rain analysis</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isLight ? 'bg-white/10' : 'bg-brand-primary/10'
                      }`}>
                        <Check className="w-2.5 h-2.5 text-brand-primary" />
                      </div>
                      <span>Real-time weather-aware priority queue</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isLight ? 'bg-white/10' : 'bg-brand-primary/10'
                      }`}>
                        <Check className="w-2.5 h-2.5 text-brand-primary" />
                      </div>
                      <span>A* pathfinding for cleanup fleet routing</span>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </motion.div>

      </div>

      {/* Floating Bottom Explore Prompt */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 hidden md:flex">
        <button 
          onClick={() => scrollTo('features')}
          className="flex flex-col items-center gap-1 text-text-muted hover:text-brand-primary transition-colors cursor-pointer group"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest group-hover:tracking-wider transition-all">
            Explore Engine Architecture
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </button>
      </div>
    </section>
  );
}
