import { Outlet, Link } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-light-background dark:bg-dark-background text-light-text dark:text-dark-text flex flex-col transition-colors duration-300">
      <header className="p-4 flex justify-between items-center border-b border-light-accent/20 dark:border-dark-accent/20">
        <Link to="/" className="flex items-center gap-2 text-light-primary dark:text-dark-primary font-heading font-bold text-xl hover:opacity-80 transition-opacity">
          <Droplets className="w-6 h-6" />
          <span>esteRoute</span>
        </Link>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-light-surface dark:hover:bg-dark-surface transition-colors">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-light-surface dark:bg-dark-surface p-6 sm:p-8 rounded-2xl shadow-xl border border-light-accent/10 dark:border-dark-accent/10 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
