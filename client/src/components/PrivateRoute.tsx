import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type PrivateRouteProps = {
  children: ReactNode;
  roles?: string[];
};

const PrivateRoute = ({ children, roles = [] }: PrivateRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Add logging for debugging
    console.log("PrivateRoute - Auth state:", { isLoading, isAuthenticated, user, roles });
    
    if (!isLoading) {
      // Authentication check is done
      if (!isAuthenticated) {
        console.log("PrivateRoute - Not authenticated, redirecting to login");
        // Redirect to login if not authenticated - use a short delay to ensure state is current
        setTimeout(() => {
          setLocation('/login');
        }, 100);
      } else if (roles.length > 0 && user && !roles.includes(user.role)) {
        console.log(`PrivateRoute - User role ${user.role} not in allowed roles:`, roles);
        // Redirect based on role if not authorized
        setTimeout(() => {
          if (user.role === 'super_admin') {
            setLocation('/admin');
          } else {
            setLocation('/dashboard');
          }
        }, 100);
      }
      
      setIsChecking(false);
    }
  }, [user, isLoading, isAuthenticated, roles, setLocation]);

  // Show loading state while checking authentication
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If authenticated and authorized, render children
  if (user && (roles.length === 0 || roles.includes(user.role))) {
    return <>{children}</>;
  }

  // Show a temporary message while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
};

export default PrivateRoute;
