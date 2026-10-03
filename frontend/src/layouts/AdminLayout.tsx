import { Outlet, Link, useLocation } from 'react-router-dom';
import { Droplets, LayoutDashboard, Archive, BarChart3, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState, useEffect } from 'react';

export default function AdminLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isNavVisible, setIsNavVisible] = useState(true);

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
      
      {/* Invisible Hover Zone (Top of Screen) */}
      <div className="fixed top-0 left-0 w-full h-12 z-[999] md:block hidden pointer-events-none" />

      {/* Top Navbar (Desktop Only) - Follows Citizen Style */}
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
              
              {/* Left: Logo */}
              <div className="flex-1 flex justify-start skew-x-12">
                <Link to="/admin" className="flex items-center gap-2 text-brand-primary font-heading font-black tracking-tighter text-lg uppercase cursor-pointer transition-transform hover:scale-105">
                  <Droplets className="w-6 h-6" />
                  <span>este<span className="text-text-primary">Route</span></span>
                </Link>
              </div>
              
              {/* Center: Navigation Links */}
              <nav className="flex-1 flex justify-center items-center gap-8 skew-x-12">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                  return (
                    <Link 
                      key={item.path} 
                      to={item.path}
                      className={twMerge(
                        clsx(
                          "relative overflow-hidden group cursor-pointer text-xs xl:text-sm font-bold uppercase tracking-widest block shrink-0",
                          isActive ? "text-brand-primary" : "text-text-muted hover:text-text-primary"
                        )
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
              
              {/* Right: Actions */}
              <div className="flex-1 flex justify-end items-center gap-4 skew-x-12">
                <button 
                  onClick={toggleTheme} 
                  className="p-1.5 hover:bg-surface rounded-sm transition-colors text-text-muted hover:text-text-primary pointer-events-auto"
                  aria-label="Toggle Theme"
                >
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
                <div className="w-px h-4 bg-border-strong"></div>
                <Link to="/" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-semantic-urgent hover:text-red-400 transition-colors pointer-events-auto">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 bg-app-bg overflow-x-hidden relative flex flex-col pb-24 md:pb-0">
        <div className={twMerge(
          clsx(
            "flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)]",
            isNavVisible ? "md:pt-28 lg:pt-32" : "md:pt-6 lg:pt-8"
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

    </div>
  );
}
