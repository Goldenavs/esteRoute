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
    { name: 'Command Center', path: '/admin', icon: LayoutDashboard },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Archive', path: '/admin/archive', icon: Archive },
  ];

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Mobile Topbar */}
      <div className="md:hidden p-4 border-b border-border-subtle bg-surface flex justify-between items-center sticky top-0 z-50">
        <Link to="/admin" className="flex items-center gap-2 text-brand-primary font-heading font-bold text-xl">
          <Droplets className="w-6 h-6" />
          <span>esteRoute Admin</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-surface-subtle transition-colors">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-surface-subtle transition-colors">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar / Mobile Drawer */}
      <aside className={twMerge(
        clsx(
          "fixed md:static inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border-subtle flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )
      )}>
        <div className="p-6 border-b border-border-subtle hidden md:block">
          <Link to="/admin" className="flex items-center gap-2 text-brand-primary font-heading font-bold text-2xl hover:opacity-80 transition-opacity">
            <Droplets className="w-8 h-8" />
            <span>esteRoute</span>
          </Link>
          <span className="text-xs uppercase tracking-widest text-text-secondary font-bold mt-1 block pl-10">Admin Panel</span>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto mt-4 md:mt-0">
          <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 ml-2">Main Menu</div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={twMerge(
                  clsx(
                    "flex items-center gap-3 p-3 rounded-xl transition-all font-medium",
                    isActive 
                      ? "bg-brand-primary text-brand-white shadow-md" 
                      : "hover:bg-surface-subtle text-text-secondary hover:text-brand-primary"
                  )
                )}
              >
                <item.icon className={twMerge(clsx("w-5 h-5", isActive && "fill-current/20"))} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border-subtle">
          <div className="flex items-center justify-between mb-4 hidden md:flex p-2 bg-app-bg rounded-xl border border-border-subtle">
            <span className="text-sm font-medium">Theme</span>
            <button onClick={toggleTheme} className="p-2 rounded-lg bg-surface shadow-sm hover:ring-2 ring-brand-primary/50 transition-all text-sm font-medium">
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
          <Link to="/" className="flex items-center gap-3 p-3 rounded-xl text-semantic-urgent hover:bg-surface-subtle transition-colors font-medium">
            <LogOut className="w-5 h-5" />
            <span>Change Role</span>
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
      <main className="flex-1 bg-app-bg overflow-x-hidden relative flex flex-col h-[calc(100vh-73px)] md:h-screen">
        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
