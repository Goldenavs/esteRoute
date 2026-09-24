import { Outlet, Link } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col transition-colors duration-300">
      <header className="p-4 flex justify-between items-center border-b border-border-subtle">
        <Link to="/" className="flex items-center gap-2 text-brand-primary font-heading font-bold text-xl hover:opacity-80 transition-opacity">
          <Droplets className="w-6 h-6" />
          <span>esteRoute</span>
        </Link>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-surface-subtle transition-colors">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>
      <main className="flex-1 flex flex-col items-center p-4 w-full">
        <Outlet />
      </main>
    </div>
  );
}
