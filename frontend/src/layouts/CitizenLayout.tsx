import { Outlet, Link, useLocation } from 'react-router-dom';
import { Droplets, Home, MapPin, Activity } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export default function CitizenLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { name: 'Report', path: '/citizen', icon: MapPin },
    { name: 'Dashboard', path: '/citizen/dashboard', icon: Home },
    { name: 'Status Map', path: '/citizen/public-map', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col transition-colors duration-300">
      {/* Top Header */}
      <header className="bg-brand-primary text-brand-white p-4 flex justify-between items-center shadow-md border-b border-brand-dark sticky top-0 z-50 transition-colors duration-300">
        <Link to="/citizen" className="flex items-center gap-2 font-heading font-bold text-xl hover:opacity-80 transition-opacity">
          <Droplets className="w-6 h-6" />
          <span>esteRoute Citizen</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-medium hover:text-brand-light transition-colors">Change Role</Link>
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/10 transition-colors">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-0 relative animate-fade-in p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-surface border-t border-border-subtle flex justify-around p-3 z-50 transition-colors duration-300">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/citizen' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={twMerge(
                clsx(
                  "flex flex-col items-center gap-1 text-xs transition-colors",
                  isActive
                    ? "text-brand-primary font-bold" 
                    : "text-text-secondary hover:text-brand-primary"
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
