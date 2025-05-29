import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';


// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  [key: string]: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  [key: string]: any;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  requestOtpMutation: UseMutationResult<any, unknown, { email: string }, unknown>;
  verifyOtpMutation: UseMutationResult<any, unknown, { email: string; otp: string }, unknown>;
  completeProfileMutation: UseMutationResult<any, unknown, any, unknown>;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateUser: (updatedUserData: Partial<User>) => void;
  setCartMergeFunction: (mergeFn: () => void) => void;
}

// Create the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [mergeGuestCart, setMergeGuestCart] = useState<(() => void) | null>(null);

  // Safe localStorage access with error handling
  const getFromLocalStorage = (key: string): string | null => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
    }
    return null;
  };

  const setToLocalStorage = (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
    }
  };

  const removeFromLocalStorage = (key: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
    }
  };

  // Check for existing user session on mount
  useEffect(() => {
    const checkAuthStatus = async (): Promise<void> => {
      try {
        const token = getFromLocalStorage('univendor_token');
        const userData = getFromLocalStorage('univendor_user');
        
        if (token && userData) {
          try {
            const parsedUser: User = JSON.parse(userData);
            
            // Optional: Validate token with server
            const isValid = await validateToken(token);
            
            if (isValid) {
              setUser(parsedUser);
            } else {
              // Clear invalid data
              removeFromLocalStorage('univendor_token');
              removeFromLocalStorage('univendor_user');
            }
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            removeFromLocalStorage('univendor_token');
            removeFromLocalStorage('univendor_user');
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Function to validate token (optional - you can remove if not needed)
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      setLoading(true);
      
      // Input validation
      if (!credentials || !credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }
      
      // API call to login endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate response data
      if (!data.token || !data.user) {
        throw new Error('Invalid response from server');
      }
      
      // Store user data and token
      setToLocalStorage('univendor_token', data.token);
      setToLocalStorage('univendor_user', JSON.stringify(data.user));
      
      setUser(data.user);

      // Merge guest cart after successful login
      if (mergeGuestCart && typeof mergeGuestCart === 'function') {
        setTimeout(() => {
          try {
            mergeGuestCart();
          } catch (cartError) {
            console.error('Error merging guest cart:', cartError);
          }
        }, 100);
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      setLoading(true);
      
      // Input validation
      if (!userData || !userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }
      
      // API call to register endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Registration failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate response data
      if (!data.token || !data.user) {
        throw new Error('Invalid response from server');
      }
      
      // Store user data and token
      setToLocalStorage('univendor_token', data.token);
      setToLocalStorage('univendor_user', JSON.stringify(data.user));
      
      setUser(data.user);

      // Merge guest cart after successful registration
      if (mergeGuestCart && typeof mergeGuestCart === 'function') {
        setTimeout(() => {
          try {
            mergeGuestCart();
          } catch (cartError) {
            console.error('Error merging guest cart:', cartError);
          }
        }, 100);
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Optional: Call logout endpoint
      const token = getFromLocalStorage('univendor_token');
      if (token) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (apiError) {
          console.error('Logout API error:', apiError);
          // Continue with local logout even if API fails
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear user data
    removeFromLocalStorage('univendor_token');
    removeFromLocalStorage('univendor_user');
    setUser(null);

    // Note: We don't clear cart here as it should persist for guests
  };

  const updateUser = (updatedUserData: Partial<User>): void => {
    try {
      if (!user) {
        console.warn('Cannot update user: no user logged in');
        return;
      }
      
      const newUserData = { ...user, ...updatedUserData };
      setUser(newUserData);
      setToLocalStorage('univendor_user', JSON.stringify(newUserData));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  // Function to set the cart merge function from CartContext
  const setCartMergeFunction = (mergeFn: () => void): void => {
    setMergeGuestCart(() => mergeFn);
  };

  // Provide dummy mutation objects to satisfy the type requirements
  const dummyMutation: UseMutationResult<any, unknown, any, unknown> = {
    data: undefined,
    error: null,
    isError: false,
    isIdle: true,
    isPaused: false,
    isSuccess: false,
    isPending: false,
    mutate: () => {},
    mutateAsync: async () => {},
    reset: () => {},
    status: 'idle',
    variables: undefined,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    submittedAt: 0,
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    setCartMergeFunction,
    isAuthenticated: !!user,
    requestOtpMutation: dummyMutation as UseMutationResult<any, unknown, { email: string }, unknown>,
    verifyOtpMutation: dummyMutation as UseMutationResult<any, unknown, { email: string; otp: string }, unknown>,
    completeProfileMutation: dummyMutation as UseMutationResult<any, unknown, any, unknown>,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};