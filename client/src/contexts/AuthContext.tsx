import { createContext, useEffect, useState, ReactNode } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'vendor';
  avatarUrl?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
};

type AuthProviderProps = {
  children: ReactNode;
};

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, setLocation] = useLocation();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to restore auth state:", error);
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('POST', '/api/auth/login', { email, password });
      const userData = await res.json();
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Redirect based on role
      if (userData.role === 'super_admin') {
        setLocation('/');
      } else {
        setLocation('/dashboard');
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('POST', '/api/auth/register', userData);
      const registeredUser = await res.json();
      
      setUser(registeredUser);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      
      // Redirect to appropriate dashboard
      if (registeredUser.role === 'super_admin') {
        setLocation('/');
      } else {
        setLocation('/dashboard');
      }
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setLocation('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
