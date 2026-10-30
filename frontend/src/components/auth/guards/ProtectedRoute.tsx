import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '../../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  allowGuest?: boolean;
  redirectTo?: string;
}

export default function ProtectedRoute({
  allowedRoles,
  allowGuest = false,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app-bg text-text-primary flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 bg-surface/75 border border-border-subtle p-6 rounded-sm shadow-xl backdrop-blur-md">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          <div className="flex flex-col items-center">
            <span className="font-heading font-black text-xs sm:text-sm tracking-widest uppercase text-text-primary">
              Verifying Security Credentials
            </span>
            <span className="font-mono text-[10px] text-text-muted mt-1">
              Validating session authentication and access telemetry...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Case 1: Unauthenticated user
  if (!user) {
    if (allowGuest) {
      return <Outlet />;
    }
    // Deny access and redirect to login, preserving intended destination
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Case 2: Role restrictions apply
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = role || 'citizen';
    const isAuthorized = allowedRoles.includes(userRole);

    if (!isAuthorized) {
      // Citizen attempting to access restricted Admin / Dispatcher routes
      if (userRole === 'citizen') {
        return <Navigate to="/citizen" replace />;
      }
      // Admin / Dispatcher attempting to access Citizen routes
      if (userRole === 'admin' || userRole === 'dispatcher') {
        return <Navigate to="/admin" replace />;
      }
      // Fallback
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <Outlet />;
}

