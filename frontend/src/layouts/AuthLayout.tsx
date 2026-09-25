import { Outlet } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col transition-colors duration-300">
      

      <main className="flex-1 flex flex-col w-full">
        <Outlet />
      </main>
    </div>
  );
}
