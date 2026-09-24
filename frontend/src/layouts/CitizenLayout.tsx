import { Outlet, Link, useLocation } from 'react-router-dom';
import { Droplets, Home, MapPin, Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function CitizenLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { name: 'Report', path: '/', icon: MapPin },
    { name: 'Dashboard', path: '/citizen-dashboard', icon: Home },
    { name: 'Status Map', path: '/public-map', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text flex flex-col transition-colors duration-300">
      {/* Top Header */}
      <header className="bg-light-primary dark:bg-dark-surface text-white dark:text-dark-text p-4 flex justify-between items-center shadow-md border-b dark:border-dark-accent/20 sticky top-0 z-50 transition-colors duration-300">
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-xl hover:opacity-80 transition-opacity">
          <Droplets className="w-6 h-6" />
          <span>esteRoute Citizen</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium hover:text-light-secondary dark:hover:text-dark-primary transition-colors">Login</Link>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-0 relative animate-fade-in">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-light-surface dark:bg-dark-surface border-t border-light-accent/20 dark:border-dark-accent/20 flex justify-around p-3 z-50 transition-colors duration-300">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={twMerge(
                clsx(
                  "flex flex-col items-center gap-1 text-xs transition-colors",
                  isActive
                    ? "text-light-primary dark:text-dark-primary font-bold" 
                    : "text-gray-500 hover:text-light-primary dark:hover:text-dark-primary"
                )
              )}
            >
              <item.icon className={twMerge(clsx("w-6 h-6", isActive && "fill-current/20"))} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
