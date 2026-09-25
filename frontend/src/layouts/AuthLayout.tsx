import { Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col transition-colors duration-300">
      
      {/* Floating Theme Toggler */}
      <button 
        onClick={toggleTheme} 
        className="fixed top-4 right-6 z-[60] p-2 bg-surface/80 backdrop-blur-md border border-border-subtle rounded-full shadow-lg hover:bg-surface transition-colors"
        aria-label="Toggle Theme"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <main className="flex-1 flex flex-col w-full">
        <Outlet />
      </main>
    </div>
  );
}
