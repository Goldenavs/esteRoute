import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Archive, BarChart3, Terminal, Sun, Moon, type LucideIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import SystemLogsModal from '../components/admin/SystemLogsModal';
import TacticalBackground from '../components/common/TacticalBackground';

const AnimatedNavLink = ({ 
  title, 
  to, 
  icon: Icon,
  isActive 
}: { 
  title: string; 
  to: string; 
  icon: LucideIcon;
  isActive?: boolean; 
}) => {
  return (
    <Link 
      to={to}
      className="font-heading relative overflow-hidden group cursor-pointer text-xs xl:text-sm font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary block shrink-0 transition-colors"
    >
      <span className={`flex items-center gap-2 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${isActive ? '-translate-y-full text-brand-primary' : 'group-hover:-translate-y-full text-text-primary'}`}>
        <Icon className="w-4 h-4 shrink-0 transition-colors" />
        <span>{title}</span>
      </span>
      <span className={`absolute inset-0 flex items-center gap-2 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] text-brand-primary ${isActive ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'}`}>
        <Icon className="w-4 h-4 shrink-0" />
        <span>{title}</span>
      </span>
    </Link>
  );
};

const ADMIN_PAGE_CONFIG: Record<string, { title: string; subtitle: string; icon: LucideIcon }> = {
  '/admin': {
    title: 'Command Center',
    subtitle: 'Live situational map, active incident triage queue, and dispatch telemetry.',
    icon: LayoutDashboard,
  },
  '/admin/analytics': {
    title: 'Waterway Analytics',
    subtitle: 'Predictive flood risk intelligence, waste classification metrics, and operational dispatch efficiency.',
    icon: BarChart3,
  },
  '/admin/archive': {
    title: 'Historical Archive',
    subtitle: 'Master records of canal blockage reports, field resolutions, and triage intelligence logs.',
    icon: Archive,
  },
};

const navSwipeVariants: Variants = {
  initial: { opacity: 0, x: -35 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.32, ease: "easeOut" } },
  exit: { opacity: 0, x: 35, transition: { duration: 0.22, ease: "easeIn" } }
};

const headerSwipeVariants: Variants = {
  initial: { opacity: 0, x: -35 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.32, ease: "easeOut" } },
  exit: { opacity: 0, x: 35, transition: { duration: 0.22, ease: "easeIn" } }
};

export default function AdminLayout() {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const isNavVisibleRef = useRef(true);
  const isNavHoveredRef = useRef(false);
  const [headerCycle, setHeaderCycle] = useState<'title' | 'subtitle'>('title');
  const untouchedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const isMapFullscreenRef = useRef(false);

  useEffect(() => {
    isMapFullscreenRef.current = isMapFullscreen;
  }, [isMapFullscreen]);

  useEffect(() => {
    const handleMapFs = (e: Event) => {
      const customEvent = e as CustomEvent<{ isFullscreen: boolean }>;
      setIsMapFullscreen(!!customEvent.detail?.isFullscreen);
    };
    const handleNativeFs = () => {
      setIsMapFullscreen(document.fullscreenElement !== null);
    };

    window.addEventListener('map-fullscreen-change', handleMapFs);
    document.addEventListener('fullscreenchange', handleNativeFs);
    return () => {
      window.removeEventListener('map-fullscreen-change', handleMapFs);
      document.removeEventListener('fullscreenchange', handleNativeFs);
    };
  }, []);

  useEffect(() => {
    isNavVisibleRef.current = isNavVisible;
  }, [isNavVisible]);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const resetUntouchedTimer = () => {
    if (untouchedTimerRef.current) {
      clearTimeout(untouchedTimerRef.current);
    }
    untouchedTimerRef.current = setTimeout(() => {
      if (!isNavHoveredRef.current) {
        setHeaderCycle('title');
        setIsNavVisible(false);
      }
    }, 3000);
  };

  // Alternate between Title and Subtitle with comfortable reading duration (Subheading 6.5s, Title 3.5s)
  useEffect(() => {
    if (isNavVisible) return;
    const displayDuration = headerCycle === 'title' ? 3500 : 6500;
    const timer = setTimeout(() => {
      setHeaderCycle((prev) => (prev === 'title' ? 'subtitle' : 'title'));
    }, displayDuration);
    return () => clearTimeout(timer);
  }, [isNavVisible, headerCycle]);

  // Handle navbar active state & untouched countdown
  useEffect(() => {
    queueMicrotask(() => {
      setIsNavVisible(true);
      resetUntouchedTimer();
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (isMapFullscreenRef.current) return;
      if (e.clientY <= 70) {
        setIsNavVisible(true);
        resetUntouchedTimer();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (untouchedTimerRef.current) clearTimeout(untouchedTimerRef.current);
    };
  }, [location.pathname]);

  const currentConfig = Object.entries(ADMIN_PAGE_CONFIG).find(([path]) => 
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path)
  )?.[1] || ADMIN_PAGE_CONFIG['/admin'];

  const navItems = [
    { name: 'Command', path: '/admin', icon: LayoutDashboard },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Archive', path: '/admin/archive', icon: Archive },
  ];

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col transition-colors duration-300 relative">
      {/* Tactical GIS Ambient Background */}
      <TacticalBackground />
      
      {/* Invisible Hover Zone (Top of Screen) */}
      {/* Tight Hover Zone (Top 20px Edge) to catch rapid mouse movements */}
      <div className="fixed top-0 left-0 w-full h-5 z-[999] md:block hidden pointer-events-none" />

      {/* Dynamic Top Bar: Nav Mode <-> Header Mode (Desktop Only) */}
      <div 
        className={twMerge(
          clsx(
            "fixed top-4 w-full z-[1000] pointer-events-none transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] hidden md:block",
            isMapFullscreen ? "-translate-y-[160%]" : "translate-y-0"
          )
        )}
      >
        <div className="flex flex-col items-center px-4 md:px-6">
          <div className="w-full max-w-[95%] xl:max-w-7xl relative pointer-events-none">
            <div 
              onMouseEnter={() => {
                isNavHoveredRef.current = true;
                if (untouchedTimerRef.current) clearTimeout(untouchedTimerRef.current);
                setIsNavVisible(true);
              }}
              onMouseLeave={() => {
                isNavHoveredRef.current = false;
                resetUntouchedTimer();
              }}
              className="w-full pointer-events-auto bg-surface/90 backdrop-blur-2xl border border-border-subtle rounded-sm px-6 sm:px-10 py-3 shadow-2xl shadow-black/10 transition-all duration-500 hover:border-border-strong -skew-x-12 relative overflow-hidden min-h-[58px] flex items-center"
            >
              {/* Static un-skew wrapper to protect text and icons from Framer Motion transform collisions */}
              <div className="w-full skew-x-12 flex items-center">
                <AnimatePresence mode="wait">
                  {isNavVisible ? (
                    <motion.div
                      key="nav-mode"
                      variants={navSwipeVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="w-full flex items-center justify-between"
                    >
                      {/* Left: Brand Logo */}
                      <div className="flex-1 flex justify-start">
                        <div className="font-heading text-base sm:text-lg font-black tracking-tighter uppercase group shrink-0 select-none cursor-default flex items-center gap-2.5">
                          <img src="/Logos/Icon-Full.png" alt="esteRoute" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
                          <span className="flex items-center">
                            <span className="text-text-primary group-hover:text-brand-primary transition-colors">
                              este
                            </span>
                            <span className="text-brand-primary group-hover:text-text-primary transition-colors">
                              Route
                            </span>
                          </span>
                        </div>
                      </div>
                      
                      {/* Center: Navigation Links */}
                      <nav className="flex-1 flex justify-center items-center gap-7 xl:gap-10">
                        {navItems.map((item) => {
                          const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                          return (
                            <AnimatedNavLink 
                              key={item.path} 
                              title={item.name}
                              to={item.path}
                              icon={item.icon}
                              isActive={isActive}
                            />
                          );
                        })}
                      </nav>
                      
                      {/* Right: Actions */}
                      <div className="flex-1 flex justify-end items-center gap-4 xl:gap-5">
                        <button 
                          onClick={() => setIsLogsOpen(true)}
                          className="p-1.5 hover:bg-surface rounded-sm transition-colors text-text-secondary hover:text-brand-primary pointer-events-auto cursor-pointer"
                          aria-label="System Logs"
                          title="System Logs"
                        >
                          <Terminal size={16} />
                        </button>
                        <button 
                          onClick={toggleTheme} 
                          className="p-1.5 hover:bg-surface rounded-sm transition-colors text-text-secondary hover:text-text-primary pointer-events-auto cursor-pointer"
                          aria-label="Toggle Theme"
                          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        >
                          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                        </button>
                        <div className="w-px h-4 bg-border-strong"></div>
                        <button 
                          type="button"
                          onClick={handleLogout}
                          className="text-xs xl:text-sm font-bold uppercase tracking-widest text-semantic-urgent hover:text-red-400 transition-colors pointer-events-auto cursor-pointer"
                        >
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="header-mode"
                      variants={headerSwipeVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="w-full flex items-center justify-center min-h-[34px] px-4 cursor-default select-none"
                    >
                      <AnimatePresence mode="wait">
                        {headerCycle === 'title' ? (
                          <motion.div
                            key={`title-${location.pathname}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center justify-center gap-3 text-center"
                          >
                            <currentConfig.icon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary shrink-0" />
                            <span className="font-heading text-base sm:text-lg lg:text-xl font-black uppercase tracking-wider text-text-primary">
                              {currentConfig.title}
                            </span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key={`subtitle-${location.pathname}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center justify-center text-center max-w-4xl px-2"
                          >
                            <span className="text-xs sm:text-sm lg:text-base text-text-secondary font-heading font-medium tracking-wide truncate">
                              {currentConfig.subtitle}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {/* pb-24 ensures content isn't hidden behind the mobile bottom tab bar */}
      <main className="flex-1 bg-transparent overflow-x-hidden relative flex flex-col pb-24 md:pb-0 z-10">
        <div className={twMerge(
          clsx(
            "flex-1 flex flex-col w-full animate-fade-in",
            location.pathname === '/admin' 
              ? "p-0 max-w-none" 
              : "p-4 md:p-6 lg:p-8 pt-4 md:pt-20 lg:pt-22 max-w-7xl mx-auto"
          )
        )}>
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border-subtle z-50 flex justify-around items-center px-2 py-3 pb-safe shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={twMerge(
                clsx(
                  "flex flex-col items-center gap-1 min-w-[64px] transition-all",
                  isActive 
                    ? "text-brand-primary scale-110" 
                    : "text-text-muted hover:text-text-primary"
                )
              )}
            >
              <item.icon className={twMerge(clsx("w-6 h-6", isActive && "drop-shadow-md"))} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* System Logs Modal */}
      <SystemLogsModal isOpen={isLogsOpen} onClose={() => setIsLogsOpen(false)} />

    </div>
  );
}
