import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Navigation, MonitorDot, Camera, MapPin, Sprout, ChevronDown, ArrowRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedLink = ({ 
  title, 
  id, 
  isActive,
  onClick 
}: { 
  title: string; 
  id: string; 
  isActive?: boolean;
  onClick: (id: string) => void; 
}) => {
  return (
    <button 
      onClick={() => onClick(id)}
      className="font-heading relative overflow-hidden group cursor-pointer text-[10px] xl:text-xs font-bold uppercase tracking-widest text-text-muted block shrink-0"
    >
      <span className={`block transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${isActive ? '-translate-y-full text-brand-primary' : 'group-hover:-translate-y-full text-text-primary'}`}>
        {title}
      </span>
      <span className={`absolute inset-0 block transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] text-brand-primary ${isActive ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'}`}>
        {title}
      </span>
    </button>
  );
};

export default function UniversalLogin() {
  const [hoveredPanel, setHoveredPanel] = useState<'admin' | 'citizen' | null>(null);
  
  // Navbar states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show navbar pill when scrolled past 10vh
      setIsScrolled(window.scrollY > window.innerHeight * 0.1);

      if (isScrollingRef.current) return;
      
      const sections = ['hero', 'features', 'core-engine', 'faqs', 'footer'];
      for (const id of [...sections].reverse()) {
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.4) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check immediately on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setIsMobileMenuOpen(false);
    setActiveSection(id);
    isScrollingRef.current = true;
    
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for the floating navbar
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      
      window.scrollTo({ top, behavior: 'smooth' });
      
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    } else {
      isScrollingRef.current = false;
    }
  };

  const links = [
    { name: 'Features', id: 'features' },
    { name: 'Core Engine', id: 'core-engine' },
    { name: 'FAQs', id: 'faqs' }
  ];

  const adminFlex = hoveredPanel === 'admin' ? 1.4 : hoveredPanel === 'citizen' ? 0.8 : 1;
  const citizenFlex = hoveredPanel === 'citizen' ? 1.4 : hoveredPanel === 'admin' ? 0.8 : 1;

  return (
    <div className="min-h-screen bg-app-bg text-text-primary w-full overflow-x-hidden">
      
      {/* Sleek Floating Navbar matching the requested styling */}
      <div className={`fixed top-0 w-full z-50 pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${isScrolled ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="flex flex-col items-center px-4 md:px-6 py-4 sm:py-6">
          <div className="w-full max-w-4xl relative pointer-events-none">
            
            <div className="w-full flex items-center justify-between lg:justify-evenly pointer-events-auto bg-surface/80 backdrop-blur-2xl border border-border-subtle rounded-full px-6 sm:px-10 py-3 shadow-lg shadow-black/5 transition-all duration-500 hover:border-border-strong hover:shadow-xl">
              
              <button 
                onClick={() => scrollTo('hero')}
                className="font-heading relative overflow-hidden text-base sm:text-lg font-black tracking-tighter uppercase group grid shrink-0 cursor-pointer"
              >
                <span className={`col-start-1 row-start-1 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${activeSection === 'hero' ? '-translate-y-full text-text-primary' : 'group-hover:-translate-y-full text-text-primary'}`}>
                  este<span className="text-brand-primary">Route</span>
                </span>
                <span className={`col-start-1 row-start-1 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] text-brand-primary ${activeSection === 'hero' ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'}`}>
                  Home<span className="text-text-primary">Page</span>
                </span>
              </button>

              <div className="hidden lg:flex items-center gap-8">
                {links.map((link) => (
                  <AnimatedLink 
                    key={link.id} 
                    title={link.name} 
                    id={link.id} 
                    isActive={activeSection === link.id}
                    onClick={scrollTo}
                  />
                ))}
              </div>

              {/* Login Buttons aligned with the sleek style */}
              <div className="hidden lg:flex items-center gap-4">
                <Link to="/citizen" className="text-[10px] xl:text-xs font-bold text-brand-primary hover:text-brand-primary/80 transition-colors uppercase tracking-widest">
                  Citizen
                </Link>
                <div className="w-px h-4 bg-border-strong"></div>
                <Link to="/admin" className="text-[10px] xl:text-xs font-bold text-text-muted hover:text-text-primary transition-colors uppercase tracking-widest">
                  Admin
                </Link>
              </div>

              <div className="flex items-center shrink-0 lg:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="flex items-center justify-center p-2 text-text-muted hover:text-brand-primary transition-colors pointer-events-auto shrink-0 bg-surface rounded-full border border-border-subtle cursor-pointer"
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>

            {/* Mobile Dropdown */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.76, 0, 0.24, 1] }}
                  className="absolute top-full mt-4 left-0 w-full pointer-events-auto lg:hidden"
                >
                  <div className="bg-surface/95 backdrop-blur-3xl border border-border-subtle rounded-[2rem] p-6 flex flex-col gap-5 shadow-2xl">
                    {links.map((link) => (
                      <div key={link.id} className="border-b border-border-subtle/50 pb-4">
                        <AnimatedLink 
                          title={link.name} 
                          id={link.id} 
                          isActive={activeSection === link.id}
                          onClick={scrollTo}
                        />
                      </div>
                    ))}
                    <div className="flex justify-between pt-2">
                      <Link to="/citizen" className="text-xs font-bold text-brand-primary tracking-widest uppercase">Citizen Login</Link>
                      <Link to="/admin" className="text-xs font-bold text-text-primary tracking-widest uppercase">Admin Login</Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
      
      {/* ---------------- SECTIONS ---------------- */}

      {/* Hero Section */}
      <section id="hero" className="relative h-screen w-full overflow-hidden bg-app-bg">
         {/* Left Side: Dispatcher / Admin (DARK THEME) */}
         <motion.div 
          className="absolute inset-0 w-full h-full bg-surface group origin-left"
          initial={false}
          animate={{
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
            className="absolute left-0 top-0 w-full md:w-[55%] h-full flex flex-col justify-center items-center md:items-start p-8 lg:p-16 z-10"
            animate={{ scale: hoveredPanel === 'admin' ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          >
            <div className="bg-brand-dark/20 p-4 rounded-2xl mb-6 ring-1 ring-brand-dark/30 shadow-[0_0_30px_rgba(var(--brand-dark),0.3)] backdrop-blur-md">
              <ShieldAlert className="w-10 h-10 text-brand-dark" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black mb-4 tracking-tighter drop-shadow-lg text-white">LGU Command</h1>
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
            <Link to="/admin" className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-dark text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-brand-dark/40 transition-all hover:-translate-y-1">
              Enter Dispatch Portal
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Right Side: Citizen (LIGHT THEME) */}
        <motion.div 
          className="absolute inset-0 w-full h-full bg-white group origin-right"
          initial={false}
          animate={{
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
           
           <div className="absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-white/80 to-white pointer-events-none" />
          
           {/* Inner Content Container - constrained to right half */}
          <motion.div 
            className="absolute right-0 top-0 w-full md:w-[55%] h-full flex flex-col justify-center items-center md:items-start p-8 lg:p-16 z-10 md:pl-16"
            animate={{ scale: hoveredPanel === 'citizen' ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          >
            <div className="bg-brand-primary/10 p-4 rounded-2xl mb-6 ring-1 ring-brand-primary/20 shadow-[0_0_30px_rgba(var(--brand-primary),0.2)] backdrop-blur-md">
              <Sprout className="w-10 h-10 text-brand-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black mb-4 tracking-tighter drop-shadow-sm text-gray-900">Citizen Portal</h1>
            <p className="text-gray-600 text-lg mb-8 font-medium">Community gateway to report floating waste, view public waterway safety maps, and track local clean-up progress.</p>
            <div className="space-y-4 mb-10 w-full">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-gray-200 w-full backdrop-blur-md shadow-sm">
                <Camera className="w-5 h-5 text-brand-primary" />
                <span className="font-bold text-gray-700">Geo-tagged Blockage Reporting</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-gray-200 w-full backdrop-blur-md shadow-sm">
                <MapPin className="w-5 h-5 text-brand-primary" />
                <span className="font-bold text-gray-700">Public Estero Status Map</span>
              </div>
            </div>
            <Link to="/citizen" className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-primary text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-brand-primary/40 transition-all hover:-translate-y-1">
              Enter Citizen Portal
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>

        <div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce text-text-muted z-40 hidden md:flex cursor-pointer hover:text-brand-primary transition-colors"
          onClick={() => scrollTo('features')}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest mb-2 drop-shadow-md">Explore esteRoute</span>
          <ChevronDown className="w-5 h-5 drop-shadow-md" />
        </div>
      </section>

      <section id="features" className="min-h-screen bg-app-bg py-24 px-8 flex flex-col items-center justify-center border-t border-border-subtle">
        <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-text-primary text-center">Features Section</h2>
        <p className="text-text-secondary">Placeholder for Features (Reporting, Dispatch, etc.)...</p>
      </section>

      <section id="core-engine" className="min-h-screen bg-surface py-24 px-8 flex flex-col items-center justify-center border-t border-border-subtle">
        <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-brand-dark text-center">Core Engine Section</h2>
        <p className="text-text-secondary">Placeholder for Core Engine (A* Algorithm & Dispatch logic)...</p>
      </section>

      <section id="faqs" className="min-h-[50vh] bg-app-bg py-24 px-8 flex flex-col items-center justify-center border-t border-border-subtle">
        <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-brand-primary text-center">FAQs Section</h2>
        <p className="text-text-secondary">Placeholder for Frequently Asked Questions...</p>
      </section>
      
      <section id="footer" className="bg-surface-subtle py-12 px-8 flex flex-col items-center justify-center border-t border-border-subtle">
        <p className="text-text-muted text-sm tracking-widest uppercase font-bold">&copy; 2026 esteRoute Capstone Project. All rights reserved.</p>
      </section>

    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-app-bg/50 border border-border-subtle/50 w-full backdrop-blur-sm">
      {icon}
      <span className="font-medium text-text-secondary">{text}</span>
    </div>
  );
}
