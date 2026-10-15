import { useState } from 'react';
import { Menu, X, Shield, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../../context/ThemeContext';

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
      className="font-heading relative overflow-hidden group cursor-pointer text-xs xl:text-sm font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary block shrink-0 transition-colors"
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

export default function AuthNavbar({ 
  activeSection,
  isScrolled,
  scrollTo,
  activePortal,
  onSelectPortal,
}: { 
  activeSection: string; 
  isScrolled: boolean; 
  scrollTo: (id: string) => void;
  activePortal: 'citizen' | 'admin';
  onSelectPortal: (portal: 'citizen' | 'admin') => void;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const links = [
    { name: 'Features', id: 'features' },
    { name: 'Core Engine', id: 'core-engine' },
    { name: 'FAQs', id: 'faqs' }
  ];

  const handleScrollTo = (id: string) => {
    setIsMobileMenuOpen(false);
    scrollTo(id);
  };

  const handlePortalSwitch = (portal: 'citizen' | 'admin') => {
    setIsMobileMenuOpen(false);
    onSelectPortal(portal);
    scrollTo('hero');
  };

  return (
    <header className={`fixed top-4 w-full z-50 pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
      isScrolled ? 'translate-y-0' : '-translate-y-[160%]'
    }`}>
      <div className="flex flex-col items-center px-4 md:px-6">
        <div className="w-full max-w-[95%] xl:max-w-7xl relative pointer-events-none">
          
          {/* Main Skewed Navbar Container */}
          <div className={`w-full flex items-center justify-between pointer-events-auto bg-surface/85 backdrop-blur-2xl border border-border-subtle rounded-sm px-6 sm:px-10 py-3 transition-all duration-500 -skew-x-12 ${
            isScrolled 
              ? 'shadow-xl shadow-black/10 border-border-strong' 
              : 'shadow-lg shadow-black/5'
          }`}>
            
            {/* Left: Brand Logo (Skew inverted) */}
            <div className="flex-1 flex justify-start skew-x-12">
              <button 
                onClick={() => handleScrollTo('hero')}
                className="font-heading text-base sm:text-lg font-black tracking-tighter uppercase group shrink-0 cursor-pointer"
              >
                <span className="text-text-primary group-hover:text-brand-primary transition-colors">
                  este<span className="text-brand-primary">Route</span>
                </span>
              </button>
            </div>

            {/* Center: Navigation Links (Skew inverted) */}
            <nav className="hidden lg:flex flex-1 justify-center items-center gap-12 xl:gap-16 skew-x-12">
              {links.map((link) => (
                <AnimatedLink 
                  key={link.id} 
                  title={link.name} 
                  id={link.id} 
                  isActive={activeSection === link.id}
                  onClick={handleScrollTo}
                />
              ))}
            </nav>

            {/* Right: Auth Portal Switches & Theme Toggle (Skew inverted) */}
            <div className="hidden lg:flex flex-1 justify-end items-center gap-5 skew-x-12">
              <button 
                type="button" 
                onClick={() => handlePortalSwitch('citizen')} 
                className={`text-xs xl:text-sm font-bold uppercase tracking-widest cursor-pointer transition-colors ${
                  activePortal === 'citizen' && activeSection === 'hero' 
                    ? 'text-brand-primary underline decoration-2 underline-offset-4' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Citizen
              </button>

              <div className="w-px h-4 bg-border-strong" />

              <button 
                type="button" 
                onClick={() => handlePortalSwitch('admin')} 
                className={`flex items-center gap-1.5 text-xs xl:text-sm font-bold uppercase tracking-widest cursor-pointer transition-colors ${
                  activePortal === 'admin' && activeSection === 'hero' 
                    ? 'text-brand-primary underline decoration-2 underline-offset-4' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>LGU Portal</span>
              </button>

              <div className="w-px h-4 bg-border-strong" />

              <button 
                onClick={toggleTheme} 
                className="p-1.5 hover:bg-surface rounded-sm transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
                aria-label="Toggle Theme"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>

            {/* Mobile Toggle Buttons */}
            <div className="flex items-center gap-3 shrink-0 lg:hidden skew-x-12">
              <button 
                onClick={toggleTheme} 
                className="p-1.5 hover:bg-surface rounded-sm transition-colors text-text-secondary pointer-events-auto"
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center justify-center p-2 text-text-secondary hover:text-brand-primary transition-colors pointer-events-auto shrink-0 bg-surface rounded-sm border border-border-subtle cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.96 }}
                transition={{ duration: 0.25, ease: [0.76, 0, 0.24, 1] }}
                className="absolute top-full mt-3 left-0 w-full pointer-events-auto lg:hidden"
              >
                <div className="bg-surface/95 backdrop-blur-3xl border border-border-subtle rounded-sm p-6 flex flex-col gap-4 shadow-2xl">
                  {links.map((link) => (
                    <div key={link.id} className="border-b border-border-subtle/50 pb-3">
                      <AnimatedLink 
                        title={link.name} 
                        id={link.id} 
                        isActive={activeSection === link.id}
                        onClick={handleScrollTo}
                      />
                    </div>
                  ))}
                  <div className="flex flex-col gap-2.5 pt-2">
                    <button 
                      onClick={() => handlePortalSwitch('citizen')} 
                      className={`w-full py-3 text-sm font-bold uppercase tracking-widest text-center rounded-sm border cursor-pointer transition-colors -skew-x-12 ${
                        activePortal === 'citizen'
                          ? 'bg-brand-primary text-white border-brand-primary'
                          : 'bg-surface text-text-primary border-border-subtle'
                      }`}
                    >
                      <span className="skew-x-12 inline-block">Citizen Portal</span>
                    </button>
                    <button 
                      onClick={() => handlePortalSwitch('admin')} 
                      className={`w-full py-3 text-sm font-bold uppercase tracking-widest text-center rounded-sm border cursor-pointer transition-colors -skew-x-12 ${
                        activePortal === 'admin'
                          ? 'bg-brand-primary text-white border-brand-primary'
                          : 'bg-surface text-text-primary border-border-subtle'
                      }`}
                    >
                      <span className="skew-x-12 inline-block">LGU Dispatch Portal</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </header>
  );
}
