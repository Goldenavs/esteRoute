import { useState, useEffect } from 'react';
import { ShieldAlert, Navigation, MonitorDot, Camera, MapPin, Sprout, ChevronDown, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import AuthModals from './AuthModals';

export default function HeroSection({ scrollTo }: { scrollTo: (id: string) => void }) {
  const [hoveredPanel, setHoveredPanel] = useState<'admin' | 'citizen' | null>(null);
  const [activeModal, setActiveModal] = useState<'admin' | 'citizen' | null>(null);
  const { theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <section 
      id="hero" 
      className="relative flex flex-col-reverse md:block md:h-screen w-full md:overflow-hidden bg-app-bg"
    >
       {/* Left Side: Dispatcher / Admin (CURRENT THEME) */}
       <motion.div 
        className="relative md:absolute md:inset-0 w-full min-h-screen md:min-h-0 md:h-full bg-surface group md:origin-left overflow-hidden flex items-center"
        initial={false}
        animate={isMobile ? { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', opacity: 1, filter: 'none', zIndex: 1 } : {
          clipPath: hoveredPanel === 'admin' 
            ? 'polygon(0% 0%, 65% 0%, 55% 100%, 0% 100%)' 
            : hoveredPanel === 'citizen' 
            ? 'polygon(0% 0%, 45% 0%, 35% 100%, 0% 100%)' 
            : 'polygon(0% 0%, 55% 0%, 45% 100%, 0% 100%)',
          opacity: hoveredPanel === 'citizen' ? 0.6 : 1,
          filter: hoveredPanel === 'citizen' ? 'blur(4px) brightness(0.5)' : 'blur(0px) brightness(1)',
          zIndex: hoveredPanel === 'admin' ? 20 : 10,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
        onMouseEnter={() => setHoveredPanel('admin')}
        onMouseLeave={() => setHoveredPanel(null)}
      >
        {/* Cinematic Background Image with Parallax Hover */}
        <div className="absolute inset-0 bg-[url('/Auth/AdminAuth.jpg')] bg-cover bg-center opacity-10 group-hover:opacity-30 transition-all duration-1000 group-hover:scale-105 pointer-events-none" />
        
        <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-dark via-surface/80 to-surface pointer-events-none" />
        
        {/* Inner Content Container - constrained to left half */}
        <motion.div 
          className="relative md:absolute md:left-0 md:top-0 w-full md:w-[55%] h-full flex flex-col justify-center items-center md:items-start p-8 lg:p-16 z-10 py-24 md:py-8"
          animate={isMobile ? { scale: 1 } : { scale: hoveredPanel === 'admin' ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        >
          <div className="max-w-md">
            <div className="bg-brand-dark/20 p-4 rounded-2xl mb-6 ring-1 ring-brand-dark/30 shadow-[0_0_30px_rgba(var(--brand-dark),0.3)] backdrop-blur-md inline-block">
              <ShieldAlert className="w-10 h-10 text-brand-dark" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black mb-4 tracking-tighter drop-shadow-lg text-text-primary">LGU Command</h1>
            <p className="text-text-secondary text-lg mb-8 font-medium">Dispatcher portal for real-time estero blockage monitoring, AI-optimized drone routes, and clean-up fleet management.</p>
            <div className="space-y-4 mb-10 w-full">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-app-bg/50 border border-border-subtle/50 w-full backdrop-blur-sm">
                <Navigation className="w-5 h-5 text-brand-dark" />
                <span className="font-medium text-text-secondary">A* Pathfinding for Cleanup Routes</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-app-bg/50 border border-border-subtle/50 w-full backdrop-blur-sm">
                <MonitorDot className="w-5 h-5 text-brand-dark" />
                <span className="font-medium text-text-secondary">Live Fleet & Drone Dispatch</span>
              </div>
            </div>
            <button onClick={() => setActiveModal('admin')} className="w-full md:w-auto flex items-center justify-center bg-text-primary text-app-bg px-8 py-4 font-bold hover:shadow-lg hover:shadow-text-primary/40 transition-all hover:-translate-y-1 cursor-pointer -skew-x-12 border-2 border-text-primary">
              <div className="skew-x-12 flex items-center gap-2">
                Enter Dispatch Portal
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Right Side: Citizen (OPPOSITE THEME) */}
      <motion.div 
        className="relative md:absolute md:inset-0 w-full min-h-screen md:min-h-0 md:h-full bg-text-primary group md:origin-right overflow-hidden flex items-center"
        initial={false}
        animate={isMobile ? { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', opacity: 1, filter: 'none', zIndex: 1 } : {
          clipPath: hoveredPanel === 'citizen'
            ? 'polygon(45% 0%, 100% 0%, 100% 100%, 35% 100%)'
            : hoveredPanel === 'admin'
            ? 'polygon(65% 0%, 100% 0%, 100% 100%, 55% 100%)'
            : 'polygon(55% 0%, 100% 0%, 100% 100%, 45% 100%)',
          opacity: hoveredPanel === 'admin' ? 0.6 : 1,
          filter: hoveredPanel === 'admin' ? 'blur(4px) brightness(0.5)' : 'blur(0px) brightness(1)',
          zIndex: hoveredPanel === 'citizen' ? 20 : 10,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 30 }}
        onMouseEnter={() => setHoveredPanel('citizen')}
        onMouseLeave={() => setHoveredPanel(null)}
      >
         {/* Cinematic Background Image with Parallax Hover */}
         <div className="absolute inset-0 bg-[url('/Auth/CitizenAuth.jpg')] bg-cover bg-center opacity-15 group-hover:opacity-40 transition-all duration-1000 group-hover:scale-105 pointer-events-none" />
         
         <div className="absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-text-primary/10 via-text-primary/80 to-text-primary pointer-events-none" />
        
         {/* Inner Content Container - aligned to right half */}
        <motion.div 
          className="relative md:absolute md:right-0 md:top-0 w-full md:w-[55%] h-full flex flex-col justify-center items-center md:items-end p-8 lg:p-16 z-10 md:pr-20 md:text-right py-24 md:py-8"
          animate={isMobile ? { scale: 1 } : { scale: hoveredPanel === 'citizen' ? 1.05 : 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        >
          <div className="max-w-md flex flex-col items-center md:items-end">
            <div className="bg-brand-primary/10 p-4 rounded-2xl mb-6 ring-1 ring-brand-primary/20 shadow-[0_0_30px_rgba(var(--brand-primary),0.2)] backdrop-blur-md inline-block">
              <Sprout className="w-10 h-10 text-brand-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black mb-4 tracking-tighter drop-shadow-sm text-app-bg">Citizen Portal</h1>
            <p className="text-surface text-lg mb-8 font-medium">Community gateway to report floating waste, view public waterway safety maps, and track local clean-up progress.</p>
            <div className="space-y-4 mb-10 w-full">
              <div className="flex items-center justify-center md:justify-end gap-3 p-3 rounded-xl bg-text-primary/60 border border-border-subtle w-full backdrop-blur-md shadow-sm">
                <Camera className="w-5 h-5 text-brand-primary" />
                <span className="font-bold text-app-bg">Geo-tagged Blockage Reporting</span>
              </div>
              <div className="flex items-center justify-center md:justify-end gap-3 p-3 rounded-xl bg-text-primary/60 border border-border-subtle w-full backdrop-blur-md shadow-sm">
                <MapPin className="w-5 h-5 text-brand-primary" />
                <span className="font-bold text-app-bg">Public Estero Status Map</span>
              </div>
            </div>
            <button onClick={() => setActiveModal('citizen')} className="w-full md:w-auto flex items-center justify-center bg-app-bg text-text-primary px-8 py-4 font-bold hover:shadow-lg hover:shadow-app-bg/40 transition-all hover:-translate-y-1 cursor-pointer -skew-x-12 border-2 border-app-bg">
              <div className="skew-x-12 flex items-center gap-2">
                Enter Citizen Portal
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </div>
        </motion.div>
      </motion.div>
      <div 
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-40 hidden md:flex cursor-pointer transition-colors ${theme === 'dark' ? 'text-brand-primary' : 'text-white'}`}
        onClick={() => scrollTo('features')}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest mb-2 drop-shadow-md">Explore esteRoute</span>
        <ChevronDown className="w-5 h-5 drop-shadow-md" />
      </div>
      <AuthModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
    </section>
  );
}
