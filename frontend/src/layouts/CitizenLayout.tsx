import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Map, Activity, User, Sun, Moon, type LucideIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState, useEffect } from 'react';
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

export default function CitizenLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavVisible, setIsNavVisible] = useState(true);

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
        // If we move away from the top, only start the hide countdown if one isn't already running
        if (!timeout) {
          timeout = setTimeout(() => {
            setIsNavVisible(false);
            timeout = null;
          }, 1000); // Hide 1 second after leaving the top zone
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Initial timer to hide the nav after page load
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
    { name: 'Report', path: '/citizen', icon: MapPin },
    { name: 'Map', path: '/citizen/public-map', icon: Map },
    { name: 'My Reports', path: '/citizen/dashboard', icon: Activity },
    { name: 'Profile', path: '/citizen/profile', icon: User },
  ];

  return (
    <div className="h-dvh md:min-h-screen bg-app-bg text-text-primary flex flex-col transition-colors duration-300 relative overflow-hidden md:overflow-visible">
      {/* Tactical GIS Ambient Background */}
      <TacticalBackground />
      
      {/* Invisible Hover Zone (Top of Screen) to catch rapid mouse movements if needed */}
      <div className="fixed top-0 left-0 w-full h-12 z-[999] md:block hidden pointer-events-none" />

      {/* Top Navbar (Desktop Only) - Follows AuthNavbar Style */}
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
              
              {/* Center: Navigation Links (Split-text & icon sliding animation) */}
              <nav className="flex-1 flex justify-center items-center gap-7 xl:gap-10 skew-x-12">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/citizen' && location.pathname.startsWith(item.path));
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
              
              {/* Right: Actions (Theme selector on the left, Logout on the right) */}
              <div className="flex-1 flex justify-end items-center gap-5 skew-x-12">
                <button 
                  onClick={toggleTheme} 
                  className="p-1.5 hover:bg-surface rounded-sm transition-colors text-text-secondary hover:text-text-primary pointer-events-auto cursor-pointer"
                  aria-label="Toggle Theme"
                  title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>

                <div className="w-px h-4 bg-border-strong" />

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
      {/* pb-16 on mobile ensures content fits above the bottom tab bar without pushing extra blank space */}
      <main className="flex-1 min-h-0 bg-transparent overflow-x-hidden relative flex flex-col pb-16 md:pb-0 z-10 overflow-hidden md:overflow-visible">
        <div className="flex-1 min-h-0 flex flex-col px-3.5 py-2 sm:p-4 md:p-6 lg:p-8 pt-2 sm:pt-4 md:pt-28 lg:pt-32 max-w-7xl mx-auto w-full animate-fade-in overflow-hidden md:overflow-visible">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border-subtle z-50 flex justify-around items-center px-2 py-3 pb-safe shadow-[0_-4px_15px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/citizen' && location.pathname.startsWith(item.path));
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

    </div>
  );
}
