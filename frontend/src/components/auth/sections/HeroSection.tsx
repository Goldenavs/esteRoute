import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Sprout, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  Loader2, 
  CheckCircle2, 
  ChevronDown,
  MapPin,
  Camera,
  Check
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface HeroSectionProps {
  activePortal: 'citizen' | 'admin';
  setActivePortal: (portal: 'citizen' | 'admin') => void;
  scrollTo: (id: string) => void;
}

export default function HeroSection({ activePortal, setActivePortal, scrollTo }: HeroSectionProps) {
  const navigate = useNavigate();

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
      {/* FULL-WIDTH DUAL BASE CANVAS (Left: Admin, Right: Citizen)  */}
      {/* ========================================================= */}
      <div className="relative w-full h-full flex flex-col md:block">
        
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
          
          {/* Admin Cinematic Background Image with Gradient Mask */}
          <div className="absolute inset-0 bg-[url('/Auth/AdminAuth.jpg')] bg-cover bg-center opacity-25 pointer-events-none scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/95 to-surface/90 pointer-events-none" />

          {/* Form Container */}
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
                  className="w-full bg-surface-subtle border-2 border-border-subtle pl-10 pr-4 py-3 text-sm text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
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
                  className="w-full bg-surface-subtle border-2 border-border-subtle pl-10 pr-10 py-3 text-sm text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
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

            <div className="mt-8 pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-secondary">
              <span>Citizen reporting or looking for map?</span>
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
          
          {/* Citizen Cinematic Background Image with Gradient Mask */}
          <div className="absolute inset-0 bg-[url('/Auth/CitizenAuth.jpg')] bg-cover bg-center opacity-30 pointer-events-none scale-105" />
          <div className="absolute inset-0 bg-gradient-to-l from-surface via-surface/95 to-surface/90 pointer-events-none" />

          {/* Form Container */}
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
                          className="w-full bg-surface-subtle border-2 border-border-subtle pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
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
                      className="w-full bg-surface-subtle border-2 border-border-subtle pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
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
                      className="w-full bg-surface-subtle border-2 border-border-subtle pl-10 pr-10 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-primary transition-colors"
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

                <div className="flex items-center justify-between mt-4 text-xs">
                  <button
                    type="button"
                    onClick={() => setCitizenMode(citizenMode === 'login' ? 'signup' : 'login')}
                    className="text-brand-primary font-bold hover:underline cursor-pointer"
                  >
                    {citizenMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePortal('admin')}
                    className="text-text-muted hover:text-text-primary font-medium cursor-pointer"
                  >
                    LGU Officer?
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* PURE FROSTED GLASS PARALLELOGRAM SLIDING CONTAINER        */}
        {/* ========================================================= */}
        <motion.div
          className="hidden md:flex absolute top-0 bottom-0 z-20 overflow-hidden backdrop-blur-2xl bg-surface/65 text-text-primary border-x border-border-subtle/80 shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] flex-col justify-between"
          style={{ width: '60vw' }}
          initial={false}
          animate={{
            x: activePortal === 'citizen' ? '-8vw' : '48vw',
            skewX: -12,
          }}
          transition={{ type: "spring", stiffness: 150, damping: 24 }}
        >
          {/* Subtle Frosted Glass Depth Shimmer (Adapts to light & dark surface) */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/5 dark:from-white/5 pointer-events-none" />

          {/* Un-skewed Content Container with Dynamic Responsive Padding */}
          <div 
            className="relative z-10 h-full flex flex-col justify-between py-14 lg:py-20 transition-all duration-500"
            style={{ 
              transform: 'skewX(12deg)',
              paddingLeft: activePortal === 'citizen' ? '14vw' : '6vw',
              paddingRight: activePortal === 'citizen' ? '6vw' : '14vw',
            }}
          >
            
            {/* Main Brand Messaging */}
            <div className="max-w-lg">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePortal}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className="text-3xl lg:text-5xl font-heading font-black tracking-tight uppercase leading-[1.08] mb-4 text-text-primary drop-shadow-sm">
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

                  <p className="text-text-secondary text-sm lg:text-base leading-relaxed mb-8 font-normal max-w-md">
                    {activePortal === 'citizen'
                      ? 'Submit photos of canal obstructions in seconds. AI and rain forecast models automatically alert municipal cleanup crews.'
                      : 'Prioritized drainage response for sanitation units. Dynamic hazard ranking and optimized cleanup routing.'}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Minimalist Highlights */}
              <div className="space-y-2.5 max-w-md text-xs sm:text-sm text-text-secondary">
                {activePortal === 'citizen' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-brand-primary" />
                      </div>
                      <span>Zero registration required to submit canal photos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-brand-primary" />
                      </div>
                      <span>Automated 48h flood risk & rain analysis</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-brand-primary" />
                      </div>
                      <span>Real-time weather-aware priority queue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-brand-primary" />
                      </div>
                      <span>A* pathfinding for cleanup fleet routing</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Controls: Map Link & Stylized Slide Door Cues */}
            <div className="pt-6 border-t border-border-subtle/80 flex items-center justify-between max-w-lg">
              {activePortal === 'citizen' ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/citizen/public-map')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand-primary transition-colors cursor-pointer group"
                  >
                    <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                    <span>View Estero Map</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </button>

                  {/* Stylized Door Slide Indicator Button (Muted, non-competing) */}
                  <button
                    type="button"
                    onClick={() => setActivePortal('admin')}
                    className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-subtle/70 hover:bg-surface-subtle border border-border-subtle hover:border-brand-primary/50 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all cursor-pointer shadow-sm"
                    title="Slide to reveal LGU Dispatcher Portal"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-primary transition-colors" />
                    <span>LGU Staff Access</span>
                    <span className="flex items-center text-text-muted group-hover:text-brand-primary transition-transform group-hover:translate-x-1 duration-300">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </>
              ) : (
                <>
                  {/* Stylized Door Slide Indicator Button (Slide back to citizen) */}
                  <button
                    type="button"
                    onClick={() => setActivePortal('citizen')}
                    className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-subtle/70 hover:bg-surface-subtle border border-border-subtle hover:border-brand-primary/50 text-xs font-semibold text-text-secondary hover:text-text-primary transition-all cursor-pointer shadow-sm"
                    title="Slide to return to Citizen Portal"
                  >
                    <span className="flex items-center text-text-muted group-hover:text-brand-primary transition-transform group-hover:-translate-x-1 duration-300">
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                    <Sprout className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-primary transition-colors" />
                    <span>Citizen Portal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/citizen')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand-primary transition-colors cursor-pointer group"
                  >
                    <span>Submit Report</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </>
              )}
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
