// import { useContext } from 'react';
// import { AuthContext } from '@/contexts/AuthContext';

// export const useAuth = () => {
//   const context = useContext(AuthContext);

//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }

//   return context;
// };
import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@/contexts/AuthContext';

// Custom hook that wraps the useAuth functionality
export const useAuthHook = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthHook must be used within an AuthProvider');
  }
  
  return context;
};

// Alternative export for backward compatibility
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Export the context for direct access if needed
export { AuthContext } from '@/contexts/AuthContext';
export type { AuthContextType, User, LoginCredentials, RegisterData, AuthResponse } from '@/contexts/AuthContext';