import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Archive, BarChart3, Terminal, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState, useEffect } from 'react';
import SystemLogsModal from '../components/admin/SystemLogsModal';
import TacticalBackground from '../components/common/TacticalBackground';

const AnimatedNavLink = ({ 
  title, 
  to, 
  isActive 
}: { 
  title: string; 
  to: string; 
  isActive?: boolean; 
}) => {
  return (
    <Link 
      to={to}
      className="font-heading relative overflow-hidden group cursor-pointer text-xs xl:text-sm font-bold uppercase tracking-widest text-text-secondary hover:text-text-primary block shrink-0 transition-colors"
    >
      <span className={`block transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${isActive ? '-translate-y-full text-brand-primary' : 'group-hover:-translate-y-full text-text-primary'}`}>
        {title}
      </span>
      <span className={`absolute inset-0 block transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] text-brand-primary ${isActive ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'}`}>
        {title}
      </span>
    </Link>
  );
};

export default function AdminLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 120) {
        setIsNavVisible(true);
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
      } else {
        if (!timeout) {
          timeout = setTimeout(() => {
            setIsNavVisible(false);
            timeout = null;
          }, 1000);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    timeout = setTimeout(() => {
      setIsNavVisible(false);
      timeout = null;
    }, 2500);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

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
      <div className="fixed top-0 left-0 w-full h-12 z-[999] md:block hidden pointer-events-none" />

      {/* Top Navbar (Desktop Only) - Follows AuthNavbar / Citizen Style */}
      <div 
        className={twMerge(
          clsx(
            "fixed top-4 w-full z-[1000] pointer-events-none transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] hidden md:block",
            isNavVisible ? "translate-y-0" : "-translate-y-[150%]"
          )
        )}
      >
        <div className="flex flex-col items-center px-4 md:px-6">
          <div className="w-full max-w-[95%] xl:max-w-7xl relative pointer-events-none">
            <div className="w-full flex items-center justify-between pointer-events-auto bg-surface/90 backdrop-blur-2xl border border-border-subtle rounded-sm px-6 sm:px-10 py-3 shadow-2xl shadow-black/10 transition-all duration-500 hover:border-border-strong -skew-x-12">
              
              {/* Left: Brand Logo (Non-clickable, matching landing page hover effect & styling) */}
              <div className="flex-1 flex justify-start skew-x-12">
                <div className="font-heading text-base sm:text-lg font-black tracking-tighter uppercase group shrink-0 select-none cursor-default">
                  <span className="text-text-primary group-hover:text-brand-primary transition-colors">
                    este<span className="text-brand-primary">Route</span>
                  </span>
                </div>
              </div>
              
              {/* Center: Navigation Links (Split-text sliding animation, matching landing page) */}
              <nav className="flex-1 flex justify-center items-center gap-10 xl:gap-14 skew-x-12">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                  return (
                    <AnimatedNavLink 
                      key={item.path} 
                      title={item.name}
                      to={item.path}
                      isActive={isActive}
                    />
                  );
                })}
              </nav>
              
              {/* Right: Actions */}
              <div className="flex-1 flex justify-end items-center gap-4 xl:gap-5 skew-x-12">
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
              : "p-4 md:p-6 lg:p-8 pt-4 md:pt-28 lg:pt-32 max-w-7xl mx-auto"
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
