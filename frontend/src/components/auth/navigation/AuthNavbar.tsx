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
      className="font-heading relative overflow-hidden group cursor-pointer text-xs xl:text-sm font-bold uppercase tracking-wider text-text-secondary hover:text-text-primary block shrink-0 transition-colors"
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
  onOpenModal
}: { 
  activeSection: string; 
  isScrolled: boolean; 
  scrollTo: (id: string) => void;
  onOpenModal: (type: 'admin' | 'citizen') => void;
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="flex flex-col items-center px-4 md:px-6 pt-3 md:pt-4">
        <div className="w-full max-w-[95%] xl:max-w-7xl relative">
          
          <div className={`w-full flex items-center justify-between backdrop-blur-xl border transition-all duration-300 rounded-2xl px-5 sm:px-8 py-3 ${
            isScrolled 
              ? 'bg-surface/90 border-border-subtle shadow-lg shadow-black/5' 
              : 'bg-surface/75 border-border-subtle/70 shadow-sm'
          }`}>
            
            {/* Left: Logo */}
            <div className="flex-1 flex justify-start">
              <button 
                onClick={() => handleScrollTo('hero')}
                className="font-heading text-lg sm:text-xl font-black tracking-tight uppercase flex items-center gap-1.5 cursor-pointer group"
              >
                <span className="text-text-primary group-hover:text-brand-primary transition-colors">
                  este<span className="text-brand-primary">Route</span>
                </span>
              </button>
            </div>

            {/* Center: Navigation Links */}
            <nav className="hidden lg:flex flex-1 justify-center items-center gap-10 xl:gap-14">
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

            {/* Right: Actions */}
            <div className="hidden lg:flex flex-1 justify-end items-center gap-4">
              <button 
                type="button" 
                onClick={() => onOpenModal('citizen')} 
                className="text-xs xl:text-sm font-bold text-text-secondary hover:text-brand-primary transition-colors uppercase tracking-wider cursor-pointer px-2 py-1"
              >
                Citizen Login
              </button>

              <button 
                type="button" 
                onClick={() => onOpenModal('admin')} 
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-primary/10 hover:bg-brand-primary hover:text-white text-brand-primary border border-brand-primary/25 text-xs xl:text-sm font-bold transition-all cursor-pointer shadow-sm group"
              >
                <Shield className="w-3.5 h-3.5 text-brand-primary group-hover:text-white transition-colors" />
                <span>LGU Portal</span>
              </button>

              <div className="w-px h-5 bg-border-subtle mx-1" />

              <button 
                onClick={toggleTheme} 
                className="p-2 hover:bg-surface-subtle rounded-xl border border-transparent hover:border-border-subtle transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
                aria-label="Toggle Theme"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2 lg:hidden">
              <button 
                onClick={toggleTheme} 
                className="p-2 hover:bg-surface-subtle rounded-xl transition-colors text-text-secondary"
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center justify-center p-2 text-text-secondary hover:text-brand-primary transition-colors bg-surface-subtle rounded-xl border border-border-subtle cursor-pointer"
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-full mt-2.5 left-0 w-full lg:hidden z-50"
              >
                <div className="bg-surface/95 backdrop-blur-2xl border border-border-subtle rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
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
                      onClick={() => { setIsMobileMenuOpen(false); onOpenModal('citizen'); }} 
                      className="w-full py-3 bg-brand-primary text-white text-sm font-bold uppercase tracking-wider text-center rounded-xl shadow-md cursor-pointer hover:bg-brand-primary/90 transition-colors"
                    >
                      Citizen Login
                    </button>
                    <button 
                      onClick={() => { setIsMobileMenuOpen(false); onOpenModal('admin'); }} 
                      className="w-full py-3 bg-surface-subtle border border-border-subtle text-text-primary text-sm font-bold uppercase tracking-wider text-center rounded-xl cursor-pointer hover:border-brand-primary transition-colors flex items-center justify-center gap-2"
                    >
                      <Shield className="w-4 h-4 text-brand-primary" />
                      <span>LGU Dispatcher Login</span>
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
