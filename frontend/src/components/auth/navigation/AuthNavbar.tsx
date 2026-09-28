import { useState } from 'react';
import { Menu, X } from 'lucide-react';
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
      className="font-heading relative overflow-hidden group cursor-pointer text-xs xl:text-sm font-bold uppercase tracking-widest text-text-muted block shrink-0"
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
    <div className={`fixed top-4 w-full z-50 pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${isScrolled ? 'translate-y-0' : '-translate-y-[150%]'}`}>
      <div className="flex flex-col items-center px-4 md:px-6">
        <div className="w-full max-w-[95%] xl:max-w-7xl relative pointer-events-none">
          
          <div className="w-full flex items-center justify-between pointer-events-auto bg-surface/80 backdrop-blur-2xl border border-border-subtle rounded-sm px-6 sm:px-10 py-3 shadow-lg shadow-black/5 transition-all duration-500 hover:border-border-strong hover:shadow-xl -skew-x-12">
            
            {/* Left: Logo */}
            <div className="flex-1 flex justify-start skew-x-12">
              <button 
                onClick={() => handleScrollTo('hero')}
                className="font-heading relative overflow-hidden text-base sm:text-lg font-black tracking-tighter uppercase group grid shrink-0 cursor-pointer"
              >
                <span className={`col-start-1 row-start-1 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${activeSection === 'hero' ? '-translate-y-full text-text-primary' : 'group-hover:-translate-y-full text-text-primary'}`}>
                  este<span className="text-brand-primary">Route</span>
                </span>
                <span className={`col-start-1 row-start-1 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] text-brand-primary ${activeSection === 'hero' ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'}`}>
                  Home<span className="text-text-primary">Page</span>
                </span>
              </button>
            </div>

            {/* Center: Navigation Links */}
            <div className="hidden lg:flex flex-1 justify-center items-center gap-12 xl:gap-16 skew-x-12">
              {links.map((link) => (
                <AnimatedLink 
                  key={link.id} 
                  title={link.name} 
                  id={link.id} 
                  isActive={activeSection === link.id}
                  onClick={handleScrollTo}
                />
              ))}
            </div>

            <div className="hidden lg:flex flex-1 justify-end items-center gap-6 skew-x-12">
              <button type="button" onClick={() => onOpenModal('admin')} className="text-xs xl:text-sm font-bold text-text-primary hover:text-brand-primary transition-colors uppercase tracking-widest cursor-pointer pointer-events-auto relative z-50">
                Admin
              </button>
              <div className="w-px h-4 bg-border-strong"></div>
              <button type="button" onClick={() => onOpenModal('citizen')} className="text-xs xl:text-sm font-bold text-text-primary hover:text-brand-primary transition-colors uppercase tracking-widest cursor-pointer pointer-events-auto relative z-50">
                Citizen
              </button>
              <div className="w-px h-4 bg-border-strong"></div>
              <button 
                onClick={toggleTheme} 
                className="p-1.5 hover:bg-surface rounded-sm transition-colors text-text-muted hover:text-text-primary"
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-4 shrink-0 lg:hidden skew-x-12">
              <button 
                onClick={toggleTheme} 
                className="p-1.5 hover:bg-surface rounded-sm transition-colors text-text-muted pointer-events-auto"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex items-center justify-center p-2 text-text-muted hover:text-brand-primary transition-colors pointer-events-auto shrink-0 bg-surface rounded-sm border border-border-subtle cursor-pointer"
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
                <div className="bg-surface/95 backdrop-blur-3xl border border-border-subtle rounded-sm p-6 flex flex-col gap-5 shadow-2xl">
                  {links.map((link) => (
                    <div key={link.id} className="border-b border-border-subtle/50 pb-4">
                      <AnimatedLink 
                        title={link.name} 
                        id={link.id} 
                        isActive={activeSection === link.id}
                        onClick={handleScrollTo}
                      />
                    </div>
                  ))}
                  <div className="flex flex-col gap-3 pt-2">
                    <button 
                      onClick={() => { setIsMobileMenuOpen(false); onOpenModal('citizen'); }} 
                      className="w-full py-3 bg-brand-primary text-app-bg text-sm font-bold uppercase tracking-widest text-center rounded-sm border border-brand-primary cursor-pointer hover:bg-brand-primary/90 transition-colors"
                    >
                      Citizen Login
                    </button>
                    <button 
                      onClick={() => { setIsMobileMenuOpen(false); onOpenModal('admin'); }} 
                      className="w-full py-3 bg-surface border border-border-strong text-text-primary text-sm font-bold uppercase tracking-widest text-center rounded-sm cursor-pointer hover:border-brand-primary transition-colors"
                    >
                      Admin Login
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
