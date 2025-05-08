import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';

type PrivateRouteProps = {
  children: ReactNode;
  roles?: string[];
};

const PrivateRoute = ({ children, roles = [] }: PrivateRouteProps) => {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Redirect to login if not authenticated
        setLocation('/login');
      } else if (roles.length > 0 && !roles.includes(user.role)) {
        // Redirect based on role if not authorized
        if (user.role === 'super_admin') {
          setLocation('/');
        } else {
          setLocation('/dashboard');
        }
      }
    }
  }, [user, isLoading, roles, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authenticated and authorized, render children
  if (user && (roles.length === 0 || roles.includes(user.role))) {
    return <>{children}</>;
  }

  // Otherwise return null (will redirect via the useEffect)
  return null;
};

export default PrivateRoute;
