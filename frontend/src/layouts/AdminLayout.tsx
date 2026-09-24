import { Outlet, Link, useLocation } from 'react-router-dom';
import { Droplets, LayoutDashboard, Archive, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState } from 'react';

export default function AdminLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Command Center', path: '/admin-dashboard', icon: LayoutDashboard },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Archive', path: '/archive', icon: Archive },
  ];

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Mobile Topbar */}
      <div className="md:hidden p-4 border-b border-light-accent/20 dark:border-dark-accent/20 bg-light-surface dark:bg-dark-surface flex justify-between items-center sticky top-0 z-50">
        <Link to="/admin-dashboard" className="flex items-center gap-2 text-light-primary dark:text-dark-primary font-heading font-bold text-xl">
          <Droplets className="w-6 h-6" />
          <span>esteRoute Admin</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-light-background dark:hover:bg-dark-background transition-colors">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar / Mobile Drawer */}
      <aside className={twMerge(
        clsx(
          "fixed md:static inset-y-0 left-0 z-40 w-64 bg-light-surface dark:bg-dark-surface border-r border-light-accent/20 dark:border-dark-accent/20 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )
      )}>
        <div className="p-6 border-b border-light-accent/20 dark:border-dark-accent/20 hidden md:block">
          <Link to="/admin-dashboard" className="flex items-center gap-2 text-light-primary dark:text-dark-primary font-heading font-bold text-2xl hover:opacity-80 transition-opacity">
            <Droplets className="w-8 h-8" />
            <span>esteRoute</span>
          </Link>
          <span className="text-xs uppercase tracking-widest text-light-accent dark:text-dark-accent font-bold mt-1 block pl-10">Admin Panel</span>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto mt-4 md:mt-0">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-2">Main Menu</div>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={twMerge(
                  clsx(
                    "flex items-center gap-3 p-3 rounded-xl transition-all font-medium",
                    isActive 
                      ? "bg-light-primary text-white dark:bg-dark-primary dark:text-dark-background shadow-md shadow-light-primary/20" 
                      : "hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 text-gray-600 dark:text-gray-300 hover:text-light-primary dark:hover:text-dark-primary"
                  )
                )}
              >
                <item.icon className={twMerge(clsx("w-5 h-5", isActive && "fill-current/20"))} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-light-accent/20 dark:border-dark-accent/20">
          <div className="flex items-center justify-between mb-4 hidden md:flex p-2 bg-light-background dark:bg-dark-background rounded-xl">
            <span className="text-sm font-medium">Theme</span>
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-light-surface dark:bg-dark-surface shadow-sm hover:ring-2 ring-light-primary/50 transition-all text-sm font-medium">
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
          <Link to="/login" className="flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30 animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 bg-light-background dark:bg-dark-background overflow-x-hidden relative flex flex-col h-[calc(100vh-73px)] md:h-screen">
        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
