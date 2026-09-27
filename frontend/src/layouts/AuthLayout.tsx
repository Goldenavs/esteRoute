import { Outlet } from 'react-router-dom';


export default function AuthLayout() {

  return (
    <div className="min-h-screen bg-app-bg text-text-primary flex flex-col transition-colors duration-300">
      

      <main className="flex-1 flex flex-col w-full">
        <Outlet />
      </main>
    </div>
  );
}
