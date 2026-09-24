import { Link } from 'react-router-dom';
import { Droplets, ShieldAlert, Users } from 'lucide-react';

export default function TemporaryAuth() {
  return (
    <div className="flex flex-col items-center justify-center p-6 w-full mt-10">
      <div className="bg-surface p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-border-subtle">
        <div className="flex justify-center mb-6 text-brand-primary">
          <Droplets className="w-16 h-16" />
        </div>
        <h1 className="text-3xl font-heading font-bold mb-2">esteRoute</h1>
        <p className="text-text-secondary mb-8">Select your role to continue</p>
        
        <div className="flex flex-col gap-4">
          <Link 
            to="/citizen" 
            className="flex items-center justify-center gap-3 w-full bg-brand-primary text-brand-white p-4 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            <Users className="w-5 h-5" />
            Citizen Flow
          </Link>
          
          <Link 
            to="/admin" 
            className="flex items-center justify-center gap-3 w-full bg-brand-dark text-brand-white p-4 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            <ShieldAlert className="w-5 h-5" />
            Admin Flow
          </Link>
        </div>
      </div>
    </div>
  );
}
