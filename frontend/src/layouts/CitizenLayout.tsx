import { Outlet, Link, useLocation } from 'react-router-dom';
import { Droplets, MapPin, Map, Activity, User, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function CitizenLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { name: 'Report', path: '/citizen', icon: MapPin },
    { name: 'Map', path: '/citizen/public-map', icon: Map },
    { name: 'My Reports', path: '/citizen/dashboard', icon: Activity },
    { name: 'Profile', path: '/citizen/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col transition-colors duration-300">
      
      {/* Top Navbar (Desktop & Mobile Header) */}
      <header className="sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md border-b border-border-subtle px-4 py-3 flex justify-between items-center shadow-sm">
        
        {/* Logo */}
        <Link to="/citizen" className="flex items-center gap-2 text-brand-primary font-heading font-black tracking-tighter text-2xl uppercase skew-x-12 cursor-pointer transition-transform hover:scale-105">
          <Droplets className="w-8 h-8 -skew-x-12" />
          <span className="hidden sm:inline">este<span className="text-text-primary">Route</span></span>
        </Link>
        
        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/citizen' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={twMerge(
                  clsx(
                    "flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-all",
                    isActive 
                      ? "text-brand-primary border-b-2 border-brand-primary pb-1" 
                      : "text-text-muted hover:text-text-primary pb-1"
                  )
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-full hover:bg-surface-subtle transition-colors text-text-muted hover:text-text-primary"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          <Link to="/" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-semantic-urgent hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      {/* padding-bottom (pb-24) ensures content isn't hidden behind the mobile bottom tab bar */}
      <main className="flex-1 bg-app-bg overflow-x-hidden relative flex flex-col pb-24 md:pb-0">
        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
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
