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
  Sparkles,
  CloudRain,
  Navigation,
  MapPin,
  Camera
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
      className="relative w-full h-screen min-h-[720px] overflow-hidden bg-app-bg flex flex-col justify-between"
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
          
          {/* Admin Cinematic Background Image */}
          <div className="absolute inset-0 bg-[url('/Auth/AdminAuth.jpg')] bg-cover bg-center opacity-20 pointer-events-none scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/95 to-surface/90 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-primary/10 via-transparent to-transparent pointer-events-none" />

          {/* Form Container */}
          <div className="relative z-10 w-full max-w-md">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 mb-6 -skew-x-12">
              <ShieldAlert className="w-5 h-5 text-brand-primary skew-x-12" />
              <span className="skew-x-12 text-xs font-heading font-black tracking-widest uppercase text-brand-primary">
                LGU Command Portal
              </span>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-heading font-black text-text-primary uppercase tracking-tight mb-2">
              Officer Sign In
            </h2>
            <p className="text-sm text-text-secondary mb-6 font-medium">
              Authorized municipal sanitation dispatchers, flood management officers, and fleet operators.
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
          
          {/* Citizen Cinematic Background Image */}
          <div className="absolute inset-0 bg-[url('/Auth/CitizenAuth.jpg')] bg-cover bg-center opacity-25 pointer-events-none scale-105" />
          <div className="absolute inset-0 bg-gradient-to-l from-surface via-surface/95 to-surface/90 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-primary/10 via-transparent to-transparent pointer-events-none" />

          {/* Form Container */}
          <div className="relative z-10 w-full max-w-md">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-brand-primary/10 border border-brand-primary/20 mb-6 -skew-x-12">
              <Sprout className="w-5 h-5 text-brand-primary skew-x-12" />
              <span className="skew-x-12 text-xs font-heading font-black tracking-widest uppercase text-brand-primary">
                Citizen Reporter Gateway
              </span>
            </div>

            <h2 className="text-3xl lg:text-4xl font-heading font-black text-text-primary uppercase tracking-tight mb-2">
              {citizenMode === 'login' ? 'Citizen Sign In' : 'Create Account'}
            </h2>
            <p className="text-sm text-text-secondary mb-6 font-medium">
              Submit canal blockages, monitor waterways, and help prevent community flooding.
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
        {/* PARALLELOGRAM SKEWED SLIDING OVERLAY CONTAINER (Desktop)  */}
        {/* ========================================================= */}
        <motion.div
          className="hidden md:flex absolute top-0 bottom-0 z-20 overflow-hidden backdrop-blur-3xl bg-surface/85 text-text-primary border-x-2 border-brand-primary/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex-col justify-between"
          style={{ width: '60vw' }}
          initial={false}
          animate={{
            x: activePortal === 'citizen' ? '-8vw' : '48vw',
            skewX: -12,
          }}
          transition={{ type: "spring", stiffness: 150, damping: 24 }}
        >
          {/* Background Images shining subtly through frosted glass */}
          <div 
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 opacity-20 pointer-events-none scale-110 ${
              activePortal === 'citizen' ? "bg-[url('/Auth/AdminAuth.jpg')]" : "bg-[url('/Auth/CitizenAuth.jpg')]"
            }`} 
          />
          {/* Frosted Glass Theme-adaptive gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-surface/75 via-surface/45 to-surface/80 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-primary/15 via-transparent to-transparent pointer-events-none" />

          {/* Un-skewed Content Container: counteracts the -12deg skew of the parent with dynamic padding */}
          <div 
            className="relative z-10 h-full flex flex-col justify-between py-12 lg:py-16 transition-all duration-500"
            style={{ 
              transform: 'skewX(12deg)',
              paddingLeft: activePortal === 'citizen' ? '14vw' : '6vw',
              paddingRight: activePortal === 'citizen' ? '6vw' : '14vw',
            }}
          >
            
            {/* Top Brand & Civic Tag */}
            <div className="max-w-lg">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-brand-primary/10 border border-brand-primary/30 text-brand-primary mb-6">
                <span className="text-[11px] font-heading font-black tracking-widest uppercase text-brand-primary flex items-center gap-2">
                  {activePortal === 'citizen' ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                      Autonomous Multi-Agent Mitigation
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5 text-brand-primary" />
                      Decision-Support Command Hub
                    </>
                  )}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activePortal}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
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
                        automated cleanup fleet dispatch.
                      </>
                    )}
                  </h1>

                  <p className="text-text-secondary text-sm lg:text-base leading-relaxed mb-6 font-normal max-w-md">
                    {activePortal === 'citizen'
                      ? 'Submit photos of canal obstructions in seconds. Gemini 1.5 multimodal AI and Open-Meteo precipitation models automatically compute flood risk and alert municipal responders.'
                      : 'Transform unranked citizen reports into a prioritized, weather-aware dispatch queue. Coordinate drone surveys, route sanitation crews via A* pathfinding, and log resolved waterways.'}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Telemetry Micro-Badges */}
              <div className="space-y-3 mt-6 max-w-md">
                {activePortal === 'citizen' ? (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-surface-subtle/70 border border-border-subtle rounded-sm backdrop-blur-sm">
                      <Camera className="w-4 h-4 text-brand-primary shrink-0" />
                      <span className="text-xs font-medium text-text-primary">
                        Zero Friction: No registration required to submit canal photos
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-surface-subtle/70 border border-border-subtle rounded-sm backdrop-blur-sm">
                      <CloudRain className="w-4 h-4 text-brand-primary shrink-0" />
                      <span className="text-xs font-medium text-text-primary">
                        48h Rain Forecast Risk Analysis via Open-Meteo
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-surface-subtle/70 border border-border-subtle rounded-sm backdrop-blur-sm">
                      <Navigation className="w-4 h-4 text-brand-primary shrink-0" />
                      <span className="text-xs font-medium text-text-primary">
                        A* Algorithmic Optimization for Fleet Cleaning Routes
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-surface-subtle/70 border border-border-subtle rounded-sm backdrop-blur-sm">
                      <ShieldAlert className="w-4 h-4 text-brand-primary shrink-0" />
                      <span className="text-xs font-medium text-text-primary">
                        Dynamic Severity Prioritization & Live Map Tracking
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Door Actions */}
            <div className="pt-6 border-t border-border-subtle flex flex-col gap-3 max-w-lg">
              {activePortal === 'citizen' ? (
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => navigate('/citizen/public-map')}
                    className="inline-flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-brand-primary" />
                    <span>View Public Estero Map →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePortal('admin')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer hover:shadow-lg hover:shadow-brand-primary/40 group rounded-sm"
                  >
                    <span>LGU Dispatch Login</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActivePortal('citizen')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer hover:shadow-lg hover:shadow-brand-primary/40 group rounded-sm"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                    <span>Return to Citizen Portal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/citizen')}
                    className="inline-flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    <span>Submit Citizen Report →</span>
                  </button>
                </div>
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
